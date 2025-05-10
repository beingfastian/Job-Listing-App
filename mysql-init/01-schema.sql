-- Create the jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT 'Job title/position',
  `company` varchar(255) NOT NULL COMMENT 'Company name',
  `location` varchar(255) DEFAULT NULL COMMENT 'Job location (city, country)',
  `description` text COMMENT 'Full job description',
  `posting_date` date DEFAULT NULL COMMENT 'Date when job was posted',
  `url` varchar(500) DEFAULT NULL COMMENT 'Link to original job posting',
  `salary` varchar(100) DEFAULT NULL COMMENT 'Salary information',
  `job_type` varchar(50) DEFAULT NULL COMMENT 'Full-time, Part-time, Contract, etc',
  `experience_level` varchar(50) DEFAULT NULL COMMENT 'Entry Level, Mid Level, Senior, etc',
  `source` varchar(50) DEFAULT 'manual' COMMENT 'manual or scraped',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  PRIMARY KEY (`id`),
  KEY `idx_source` (`source`),
  KEY `idx_company` (`company`),
  KEY `idx_location` (`location`),
  KEY `idx_job_type` (`job_type`),
  KEY `idx_posting_date` (`posting_date`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create logs table for tracking scraper activity
CREATE TABLE IF NOT EXISTS `scraper_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `run_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) NOT NULL COMMENT 'success, error, partial',
  `jobs_found` int DEFAULT '0' COMMENT 'Number of jobs found during scraping',
  `jobs_added` int DEFAULT '0' COMMENT 'Number of new jobs added to database',
  `jobs_updated` int DEFAULT '0' COMMENT 'Number of existing jobs updated',
  `error_message` text COMMENT 'Error message if scraping failed',
  `duration_seconds` int DEFAULT '0' COMMENT 'Time taken for scraping in seconds',
  PRIMARY KEY (`id`),
  KEY `idx_run_date` (`run_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create view for job statistics
CREATE OR REPLACE VIEW `job_stats` AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(CASE WHEN source = 'scraped' THEN 1 ELSE 0 END) as scraped_jobs,
  SUM(CASE WHEN source = 'manual' THEN 1 ELSE 0 END) as manual_jobs,
  COUNT(DISTINCT company) as total_companies,
  COUNT(DISTINCT location) as total_locations,
  MAX(created_at) as last_job_added,
  MAX(updated_at) as last_job_updated
FROM jobs;

-- Create sample scraped data
INSERT INTO `jobs` 
  (`title`, `company`, `location`, `description`, `posting_date`, `url`, `salary`, `job_type`, `experience_level`, `source`)
VALUES
  ('Actuarial Analyst', 'Munich Re', 'Munich, Germany', 'Join our actuarial team to work on cutting-edge insurance models. Responsibilities include:\n\n- Developing and maintaining actuarial models\n- Analyzing insurance risk data\n- Preparing reports and presentations for management\n- Collaborating with underwriting and claims teams\n\nRequirements include a degree in Actuarial Science, Mathematics, or related field, and progress toward actuarial certification.', '2025-05-01', 'https://example.com/job1', '$80,000 - $100,000', 'Health', 'Entry Level', 'scraped'),
  
  ('Senior Actuary', 'Allianz', 'Berlin, Germany', 'Lead actuarial projects in our global team focusing on life insurance product development. Key responsibilities:\n\n- Lead pricing for new product development\n- Perform experience studies and assumption setting\n- Mentor junior actuaries\n- Communicate with regulatory authorities\n\nRequires FSA/FIA certification and 5+ years of experience in life insurance.', '2025-05-05', 'https://example.com/job2', '$120,000 - $150,000', 'Life', 'Senior', 'scraped'),
  
  ('Risk Analyst', 'Swiss Re', 'Zurich, Switzerland', 'Analyze and quantify financial risks across reinsurance portfolios. The role includes:\n\n- Building and validating risk models\n- Conducting stress tests and scenario analyses\n- Preparing risk reports for management and clients\n- Supporting capital allocation decisions\n\nIdeal candidates have a strong background in statistics, financial mathematics, or actuarial science.', '2025-05-07', 'https://example.com/job3', '$90,000 - $110,000', 'Reinsurance', 'Mid Level', 'scraped'),
  
  ('Data Scientist', 'AXA', 'Paris, France', 'Apply machine learning to solve complex actuarial problems and improve risk assessment. Responsibilities include:\n\n- Developing predictive models for claims and pricing\n- Implementing machine learning algorithms\n- Working with large datasets from multiple sources\n- Creating data visualizations to communicate findings\n\nRequires expertise in Python or R, SQL, and statistical analysis.', '2025-05-08', 'https://example.com/job4', '€85,000 - €105,000', 'Analytics', 'Mid Level', 'scraped'),
  
  ('Actuarial Consultant', 'Deloitte', 'London, UK', 'Provide actuarial consulting services to top-tier insurance clients. This role involves:\n\n- Delivering complex actuarial valuations and analyses\n- Advising clients on Solvency II and IFRS 17 implementation\n- Developing solutions for client-specific problems\n- Building and maintaining client relationships\n\nRequires strong communication skills and actuarial qualification progress.', '2025-05-09', 'https://example.com/job5', '£70,000 - £90,000', 'Consulting', 'Mid Level', 'scraped'),
  
  ('Pension Actuary', 'Willis Towers Watson', 'New York, USA', 'Specialize in defined benefit and defined contribution pension plans. Responsibilities include:\n\n- Performing actuarial valuations for pension plans\n- Advising on funding strategies and investment policies\n- Ensuring compliance with regulatory requirements\n- Communicating complex actuarial concepts to clients\n\nRequires EA designation or progress toward it, and experience with pension regulations.', '2025-05-10', 'https://example.com/job6', '$95,000 - $125,000', 'Pension', 'Senior', 'scraped'),
  
  ('Product Actuary', 'Prudential Financial', 'Newark, USA', 'Develop and manage life insurance products. The role includes:\n\n- Performing pricing and profitability analyses\n- Participating in product design and feature development\n- Monitoring product performance\n- Supporting marketing initiatives\n\nRequires strong technical skills and knowledge of life insurance products.', '2025-05-10', 'https://example.com/job7', '$85,000 - $115,000', 'Life', 'Mid Level', 'scraped'),
  
  ('Health Insurance Actuary', 'Cigna', 'Philadelphia, USA', 'Specialize in health insurance pricing and risk management. Key responsibilities:\n\n- Developing premium rates for group and individual health plans\n- Analyzing healthcare utilization and cost trends\n- Assessing impact of regulatory changes\n- Collaborating with underwriting and claims departments\n\nRequires knowledge of healthcare systems and regulations.', '2025-05-11', 'https://example.com/job8', '$90,000 - $120,000', 'Health', 'Mid Level', 'scraped');

-- Insert initial scraper log
INSERT INTO `scraper_logs` 
  (`run_date`, `status`, `jobs_found`, `jobs_added`, `jobs_updated`, `duration_seconds`)
VALUES
  (NOW(), 'success', 8, 8, 0, 45);