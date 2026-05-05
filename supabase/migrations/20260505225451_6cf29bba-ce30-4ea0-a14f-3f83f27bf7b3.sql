
-- 1. legal consent timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_accepted_at TIMESTAMPTZ NULL;

-- 2. dedupe guard for international_colleges
CREATE UNIQUE INDEX IF NOT EXISTS international_colleges_name_unique
  ON public.international_colleges (lower(name));

-- 3. expanded intl dataset (skip dupes via the unique lower(name) index)
INSERT INTO public.international_colleges
  (name, country, city, website, programs, admit_rate, avg_cost_usd, setting, athletic_division, enrollment, order_index)
VALUES
  ('ETH Zurich', 'Switzerland', 'Zurich', 'https://ethz.ch', ARRAY['Engineering','Computer Science','Physics','Mathematics'], 0.27, 1500, 'Urban', 'None', 22200, 100),
  ('EPFL', 'Switzerland', 'Lausanne', 'https://epfl.ch', ARRAY['Engineering','Computer Science','Life Sciences'], 0.30, 1500, 'Urban', 'None', 12500, 101),
  ('University of Amsterdam', 'Netherlands', 'Amsterdam', 'https://uva.nl', ARRAY['Social Sciences','Business','Humanities','Law'], 0.40, 16000, 'Urban', 'None', 41000, 102),
  ('Delft University of Technology', 'Netherlands', 'Delft', 'https://tudelft.nl', ARRAY['Engineering','Architecture','Computer Science'], 0.32, 18000, 'Urban', 'None', 27000, 103),
  ('University of Copenhagen', 'Denmark', 'Copenhagen', 'https://ku.dk', ARRAY['Health Sciences','Humanities','Law','Natural Sciences'], 0.41, 17000, 'Urban', 'None', 37500, 104),
  ('Lund University', 'Sweden', 'Lund', 'https://lunduniversity.lu.se', ARRAY['Engineering','Business','Humanities','Medicine'], 0.45, 16000, 'Urban', 'None', 40000, 105),
  ('Heidelberg University', 'Germany', 'Heidelberg', 'https://uni-heidelberg.de', ARRAY['Medicine','Physics','Humanities','Law'], 0.18, 3500, 'Urban', 'None', 30000, 106),
  ('Technical University of Munich', 'Germany', 'Munich', 'https://tum.de', ARRAY['Engineering','Computer Science','Natural Sciences'], 0.20, 3500, 'Urban', 'None', 50000, 107),
  ('Sorbonne University', 'France', 'Paris', 'https://sorbonne-universite.fr', ARRAY['Humanities','Sciences','Medicine'], 0.35, 4000, 'Urban', 'None', 55000, 108),
  ('KU Leuven', 'Belgium', 'Leuven', 'https://kuleuven.be', ARRAY['Engineering','Medicine','Humanities','Law'], 0.50, 8500, 'Urban', 'None', 60000, 109),
  ('University of Tokyo', 'Japan', 'Tokyo', 'https://u-tokyo.ac.jp', ARRAY['Engineering','Sciences','Medicine','Humanities'], 0.34, 5000, 'Urban', 'None', 28000, 110),
  ('Kyoto University', 'Japan', 'Kyoto', 'https://kyoto-u.ac.jp', ARRAY['Sciences','Engineering','Humanities','Medicine'], 0.36, 5000, 'Urban', 'None', 22000, 111),
  ('Osaka University', 'Japan', 'Osaka', 'https://osaka-u.ac.jp', ARRAY['Engineering','Medicine','Sciences'], 0.40, 5000, 'Urban', 'None', 25000, 112),
  ('National University of Singapore', 'Singapore', 'Singapore', 'https://nus.edu.sg', ARRAY['Engineering','Business','Computer Science','Medicine'], 0.05, 30000, 'Urban', 'None', 38000, 113),
  ('Nanyang Technological University', 'Singapore', 'Singapore', 'https://ntu.edu.sg', ARRAY['Engineering','Business','Sciences'], 0.36, 28000, 'Urban', 'None', 33000, 114),
  ('Tsinghua University', 'China', 'Beijing', 'https://tsinghua.edu.cn', ARRAY['Engineering','Computer Science','Sciences'], 0.02, 5000, 'Urban', 'None', 50000, 115),
  ('Peking University', 'China', 'Beijing', 'https://pku.edu.cn', ARRAY['Sciences','Humanities','Medicine','Economics'], 0.02, 5000, 'Urban', 'None', 45000, 116),
  ('Fudan University', 'China', 'Shanghai', 'https://fudan.edu.cn', ARRAY['Sciences','Humanities','Medicine','Economics'], 0.04, 6000, 'Urban', 'None', 35000, 117),
  ('Seoul National University', 'South Korea', 'Seoul', 'https://snu.ac.kr', ARRAY['Engineering','Sciences','Humanities','Medicine'], 0.10, 6000, 'Urban', 'None', 28000, 118),
  ('KAIST', 'South Korea', 'Daejeon', 'https://kaist.ac.kr', ARRAY['Engineering','Computer Science','Sciences'], 0.15, 8000, 'Urban', 'None', 11000, 119),
  ('Yonsei University', 'South Korea', 'Seoul', 'https://yonsei.ac.kr', ARRAY['Business','Humanities','Sciences','Medicine'], 0.20, 12000, 'Urban', 'None', 38000, 120),
  ('Hong Kong University of Science and Technology', 'Hong Kong', 'Hong Kong', 'https://hkust.edu.hk', ARRAY['Engineering','Business','Sciences'], 0.30, 22000, 'Urban', 'None', 16000, 121),
  ('University of Hong Kong', 'Hong Kong', 'Hong Kong', 'https://hku.hk', ARRAY['Medicine','Law','Business','Sciences'], 0.10, 22000, 'Urban', 'None', 30000, 122)
ON CONFLICT (lower(name)) DO NOTHING;
