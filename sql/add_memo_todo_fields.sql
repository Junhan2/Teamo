-- team_todos 테이블에 priority와 category 컬럼 추가
ALTER TABLE team_todos 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '업무';

-- team_memos 테이블에 priority와 category 컬럼 추가
ALTER TABLE team_memos 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '기타';

-- 기존 데이터에 기본값 설정
UPDATE team_todos SET priority = 'medium' WHERE priority IS NULL;
UPDATE team_todos SET category = '업무' WHERE category IS NULL;

UPDATE team_memos SET priority = 'medium' WHERE priority IS NULL;
UPDATE team_memos SET category = '기타' WHERE category IS NULL;