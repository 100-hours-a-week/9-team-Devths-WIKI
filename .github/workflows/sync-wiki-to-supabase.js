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
 * Wiki 파일에서 블로그 포스트를 추출
 * [TeamBlog]로 시작하는 페이지만 자동으로 감지하여 게시글로 인식
 */
function findBlogPosts(wikiDir) {
  const blogPosts = [];
  const files = fs.readdirSync(wikiDir);
  
  // [TeamBlog]로 시작하는 .md 파일만 필터링
  const blogFiles = files.filter(file => 
    file.endsWith('.md') && 
    (file.startsWith('[TeamBlog]') || file.includes('[TeamBlog]'))
  );
  
  console.log(`📂 ${blogFiles.length}개의 TeamBlog 게시글 파일을 스캔 중...\n`);
  
  if (blogFiles.length === 0) {
    console.log('⚠️  [TeamBlog]로 시작하는 페이지를 찾을 수 없습니다.');
    console.log('💡 새 게시글을 작성하려면: New Page → 페이지 이름: `[TeamBlog] 제목`\n');
    return blogPosts;
  }
  
  blogFiles.forEach(file => {
    const filePath = path.join(wikiDir, file);
    
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
      
      // 페이지 이름에서 제목 추출 ([TeamBlog] 제목 형식)
      const titleFromFilename = file
        .replace(/^\[TeamBlog\]\s*/, '')
        .replace(/\.md$/, '')
        .trim();
      
      // Front Matter가 있으면 우선 사용, 없으면 파일명에서 추출
      const title = frontMatter.title || titleFromFilename;
      const description = frontMatter.description || extractDescription(markdownContent);
      const date = frontMatter.date || frontMatter.created_at || extractDateFromFilename(file) || new Date().toISOString().split('T')[0];
      
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
      
      console.log(`✅ 게시글 발견: ${title} (파일: ${file})`);
    } catch (error) {
      console.error(`⚠️  파일 파싱 오류 (${file}):`, error.message);
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
