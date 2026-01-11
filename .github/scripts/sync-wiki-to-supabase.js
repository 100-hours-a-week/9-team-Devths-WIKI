#!/usr/bin/env node

/**
 * GitHub Wiki에서 블로그 포스트를 파싱하고 Supabase에 동기화하는 스크립트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 확인
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const wikiPath = process.env.WIKI_PATH || './wiki';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('필요한 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  console.error('\n💡 테스트 모드: 파싱만 수행합니다 (Supabase 동기화는 건너뜁니다).\n');
}

const TEST_MODE = !supabaseUrl || !supabaseServiceKey;

// Supabase 클라이언트 생성 (Service Key 사용 - RLS 우회)
const supabase = TEST_MODE ? null : createClient(supabaseUrl, supabaseServiceKey);

/**
 * TeamBlog 페이지에서 마크다운 링크 추출
 */
function extractLinksFromTeamBlog(wikiDir) {
  const teamBlogFiles = ['TeamBlog.md', '✍️Team-Blog.md', 'Team-Blog.md'];
  let teamBlogContent = '';
  let teamBlogFile = null;
  
  // TeamBlog 페이지 찾기
  for (const fileName of teamBlogFiles) {
    const filePath = path.join(wikiDir, fileName);
    if (fs.existsSync(filePath)) {
      teamBlogContent = fs.readFileSync(filePath, 'utf-8');
      teamBlogFile = fileName;
      break;
    }
  }
  
  if (!teamBlogContent) {
    console.log('⚠️  TeamBlog 페이지를 찾을 수 없습니다.');
    return [];
  }
  
  console.log(`📄 TeamBlog 페이지 발견: ${teamBlogFile}\n`);
  
  // 마크다운 링크 패턴 추출
  // 예: [팀블로그](TeamBlog), [팀블로그](https://github.com/.../wiki/TeamBlog)
  const linkPatterns = [
    /\[([^\]]+)\]\(([^)]+)\)/g,  // 일반 마크다운 링크
    /\|([^|]+)\|\[([^\]]+)\]\(([^)]+)\)/g,  // 테이블 형식 링크
  ];
  
  const linkedPages = new Set();
  
  // 모든 링크 패턴에서 페이지 이름 추출
  linkPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(teamBlogContent)) !== null) {
      let pageName = null;
      
      if (match.length === 3) {
        // 일반 링크: [텍스트](링크)
        pageName = match[2];
      } else if (match.length === 4) {
        // 테이블 링크: |컬럼| [텍스트](링크)
        pageName = match[3];
      }
      
      if (pageName) {
        // URL에서 페이지 이름 추출
        // 예: https://github.com/.../wiki/TeamBlog → TeamBlog
        // 예: TeamBlog → TeamBlog
        const urlMatch = pageName.match(/wiki\/([^\/\#\?]+)/);
        if (urlMatch) {
          pageName = urlMatch[1];
        } else {
          // 이미 페이지 이름인 경우
          pageName = pageName.split('/').pop().split('#').shift().split('?').shift();
        }
        
        // TeamBlog 페이지 자체는 제외
        if (pageName && !pageName.includes('TeamBlog') && pageName !== 'TeamBlog') {
          linkedPages.add(pageName);
        }
      }
    }
  });
  
  return Array.from(linkedPages);
}

/**
 * Wiki 파일에서 블로그 포스트를 추출
 * TeamBlog 페이지의 링크를 파싱하여 연결된 페이지들을 게시글로 인식
 */
function findBlogPosts(wikiDir) {
  const blogPosts = [];
  
  // TeamBlog 페이지에서 링크 추출
  const linkedPages = extractLinksFromTeamBlog(wikiDir);
  
  if (linkedPages.length === 0) {
    console.log('⚠️  TeamBlog 페이지에서 링크를 찾을 수 없습니다.');
    console.log('💡 TeamBlog 페이지에 마크다운 링크를 추가하세요:');
    console.log('   예: | 팀블로그 | [팀블로그](TeamBlog) |');
    console.log('   예: [게시글 제목](게시글-제목)\n');
    return blogPosts;
  }
  
  console.log(`🔗 ${linkedPages.length}개의 링크된 페이지를 찾았습니다: ${linkedPages.join(', ')}\n`);
  
  // 각 링크된 페이지를 게시글로 처리
  linkedPages.forEach(pageName => {
    // 페이지 이름을 파일명으로 변환 (공백 → 하이픈, 특수문자 처리)
    const fileName = `${pageName}.md`;
    const filePath = path.join(wikiDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일을 찾을 수 없습니다: ${fileName}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Front Matter 파싱
      let parsed;
      let frontMatter = {};
      let markdownContent = content;
      
      if (content.includes('---')) {
        parsed = matter(content);
        frontMatter = parsed.data;
        markdownContent = parsed.content;
      }
      
      // Front Matter가 있으면 우선 사용, 없으면 파일명에서 추출
      const title = frontMatter.title || pageName.replace(/-/g, ' ');
      const description = frontMatter.description || extractDescription(markdownContent);
      const date = frontMatter.date || frontMatter.created_at || extractDateFromFilename(fileName) || new Date().toISOString().split('T')[0];
      
      blogPosts.push({
        title: title,
        description: description,
        date: date,
        author_name: frontMatter.author_name || frontMatter.author || 'Devths Team',
        author_role: frontMatter.author_role || frontMatter.role || 'Team Member',
        author_avatar: frontMatter.author_avatar,
        category: frontMatter.category || 'Culture',
        tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : extractTags(markdownContent),
        content: markdownContent,
        thumbnail: frontMatter.thumbnail,
        read_time: frontMatter.read_time || frontMatter.readTime || calculateReadTime(markdownContent),
        published: frontMatter.published !== false, // 기본값은 true
      });
      
      console.log(`✅ 게시글 발견: ${title} (페이지: ${pageName})`);
    } catch (error) {
      console.error(`⚠️  파일 파싱 오류 (${fileName}):`, error.message);
    }
  });
  
  return blogPosts;
}

/**
 * 파일명에서 날짜 추출 (예: Blog-2026-01-15-제목.md)
 */
function extractDateFromFilename(filename) {
  const dateMatch = filename.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  if (dateMatch) {
    return dateMatch[1].replace(/\//g, '-');
  }
  return null;
}

/**
 * 마크다운에서 제목 추출
 */
function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#+\s+(.+)$/);
    if (match) return match[1].trim();
  }
  return 'Untitled';
}

/**
 * 마크다운에서 설명 추출 (첫 번째 문단)
 */
function extractDescription(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && !line.startsWith('![')) {
      return line.trim().substring(0, 200);
    }
  }
  return 'No description';
}

/**
 * 마크다운에서 날짜 추출
 */
function extractDateFromContent(content) {
  const dateMatch = content.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
  if (dateMatch) {
    return dateMatch[1].replace(/\//g, '-');
  }
  return null;
}

/**
 * 마크다운에서 태그 추출
 */
function extractTags(content) {
  const tagMatches = content.match(/#(\w+)/g);
  if (tagMatches) {
    return tagMatches.map(tag => tag.replace('#', '')).slice(0, 10);
  }
  return [];
}

/**
 * 읽기 시간 계산 (분)
 */
function calculateReadTime(content) {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // 평균 200단어/분
  return Math.max(1, minutes);
}

/**
 * Supabase에 포스트 동기화
 */
async function syncToSupabase(posts) {
  if (TEST_MODE) {
    console.log(`\n⚠️  테스트 모드: ${posts.length}개의 포스트를 파싱했습니다.\n`);
    console.log('📋 파싱된 포스트 목록:');
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   카테고리: ${post.category}`);
      console.log(`   작성자: ${post.author_name}`);
      console.log(`   날짜: ${post.date}`);
      console.log(`   태그: ${post.tags.join(', ')}`);
      console.log(`   내용 길이: ${post.content.length}자`);
    });
    console.log('\n✅ 파싱 완료! (Supabase 동기화는 Service Key가 필요합니다)\n');
    return;
  }
  
  console.log(`\n📤 ${posts.length}개의 포스트를 Supabase에 동기화 중...\n`);
  
  for (const post of posts) {
    try {
      // slug 생성 (제목 기반)
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // 기존 포스트 확인 (제목으로)
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('title', post.title)
        .single();
      
      const postData = {
        title: post.title,
        description: post.description,
        date: post.date,
        author_name: post.author_name,
        author_role: post.author_role,
        author_avatar: post.author_avatar || null,
        category: post.category,
        tags: post.tags,
        content: post.content,
        thumbnail: post.thumbnail || null,
        read_time: post.read_time,
        published: post.published,
      };
      
      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', existing.id);
        
        if (error) {
          console.error(`❌ 업데이트 실패: ${post.title}`, error.message);
        } else {
          console.log(`✅ 업데이트: ${post.title}`);
        }
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        
        if (error) {
          console.error(`❌ 생성 실패: ${post.title}`, error.message);
        } else {
          console.log(`✨ 생성: ${post.title}`);
        }
      }
    } catch (error) {
      console.error(`❌ 오류: ${post.title}`, error.message);
    }
  }
  
  console.log('\n✅ 동기화 완료!\n');
}

/**
 * 메인 실행
 */
async function main() {
  console.log('🚀 Wiki → Supabase 동기화 시작\n');
  console.log(`📁 Wiki 경로: ${path.resolve(wikiPath)}\n`);
  
  if (!fs.existsSync(wikiPath)) {
    console.error(`❌ Wiki 경로를 찾을 수 없습니다: ${wikiPath}`);
    process.exit(1);
  }
  
  // 블로그 포스트 추출
  const posts = findBlogPosts(wikiPath);
  
  if (posts.length === 0) {
    console.log('⚠️  추출된 포스트가 없습니다.');
    console.log('\n💡 팁: Wiki 파일에 다음과 같은 형식으로 작성하세요:');
    console.log('---');
    console.log('title: "게시글 제목"');
    console.log('description: "게시글 설명"');
    console.log('date: "2026-01-15"');
    console.log('category: "Culture"');
    console.log('tags: ["태그1", "태그2"]');
    console.log('---');
    console.log('\n게시글 내용...');
    process.exit(0);
  }
  
  console.log(`📝 ${posts.length}개의 포스트를 찾았습니다.\n`);
  
  // Supabase에 동기화
  await syncToSupabase(posts);
}

// 실행
main().catch(error => {
  console.error('❌ 치명적 오류:', error);
  process.exit(1);
});
