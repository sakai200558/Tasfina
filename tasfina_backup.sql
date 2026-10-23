/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: Tasfina_db
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `business_types`
--

DROP TABLE IF EXISTS `business_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_types` (
  `type_code` varchar(30) NOT NULL COMMENT 'タイプコード',
  `type_name` varchar(50) DEFAULT NULL COMMENT 'タイプの名前',
  `multiplier` float DEFAULT NULL COMMENT 'マルチ',
  PRIMARY KEY (`type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='ビジネスタイプ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_types`
--

LOCK TABLES `business_types` WRITE;
/*!40000 ALTER TABLE `business_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `business_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `busy_day_settings`
--

DROP TABLE IF EXISTS `busy_day_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `busy_day_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '設定のid',
  `date` date DEFAULT NULL COMMENT 'データ',
  `required_peple` int(11) DEFAULT NULL COMMENT '一回きりの',
  `bonus_pt` float DEFAULT NULL COMMENT 'ボーナスポイント',
  `is_active` tinyint(1) DEFAULT NULL COMMENT '有効かどうか',
  PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='busy_day_settings';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `busy_day_settings`
--

LOCK TABLES `busy_day_settings` WRITE;
/*!40000 ALTER TABLE `busy_day_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `busy_day_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_members`
--

DROP TABLE IF EXISTS `department_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_members` (
  `dm_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'DMのID',
  `user_id` int(11) DEFAULT NULL COMMENT 'ユーザーID',
  `dept_id` int(11) DEFAULT NULL COMMENT 'deptのID',
  `joined_at` datetime DEFAULT NULL COMMENT '入った日',
  PRIMARY KEY (`dm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='department_members';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_members`
--

LOCK TABLES `department_members` WRITE;
/*!40000 ALTER TABLE `department_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `department_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `dept_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'デパートメントID',
  `group_id` int(11) DEFAULT NULL COMMENT 'グループID',
  `dept_name` varchar(30) DEFAULT NULL COMMENT 'デパートメントの名前',
  `dept_code` varchar(30) DEFAULT NULL COMMENT 'デパートメントのコード',
  `parent_dept_id` int(11) DEFAULT NULL COMMENT '親デパートメントのID',
  `leader_id` int(11) DEFAULT NULL COMMENT 'リーダーID',
  `created_at` datetime DEFAULT NULL COMMENT '作られた日',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='departments';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `difficulties`
--

DROP TABLE IF EXISTS `difficulties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `difficulties` (
  `difficulty_code` varchar(30) NOT NULL COMMENT 'difficulty_code',
  `difficulty_name` varchar(30) DEFAULT NULL COMMENT 'difficulty_name',
  `multiplier` float DEFAULT NULL COMMENT 'multiplier',
  PRIMARY KEY (`difficulty_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='difficulties';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `difficulties`
--

LOCK TABLES `difficulties` WRITE;
/*!40000 ALTER TABLE `difficulties` DISABLE KEYS */;
/*!40000 ALTER TABLE `difficulties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fixed_additions`
--

DROP TABLE IF EXISTS `fixed_additions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixed_additions` (
  `addition_code` varchar(30) NOT NULL COMMENT '追加コード',
  `addition_name` varchar(30) DEFAULT NULL COMMENT '追加名前',
  `point` float DEFAULT NULL COMMENT 'ポイント',
  PRIMARY KEY (`addition_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='fixed_additions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fixed_additions`
--

LOCK TABLES `fixed_additions` WRITE;
/*!40000 ALTER TABLE `fixed_additions` DISABLE KEYS */;
/*!40000 ALTER TABLE `fixed_additions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_titiles`
--

DROP TABLE IF EXISTS `job_titiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_titiles` (
  `job_title` varchar(30) NOT NULL COMMENT '仕事のタイトル',
  `job_name` varchar(30) DEFAULT NULL COMMENT '仕事名',
  `base_factor` float DEFAULT NULL COMMENT '基礎係数',
  PRIMARY KEY (`job_title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='job_titiles';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_titiles`
--

LOCK TABLES `job_titiles` WRITE;
/*!40000 ALTER TABLE `job_titiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_titiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member`
--

DROP TABLE IF EXISTS `member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'グループのID',
  `group_name` varchar(30) DEFAULT NULL COMMENT 'グループの名前',
  `owner_id` int(11) DEFAULT NULL COMMENT 'オーナーのID',
  `created_at` datetime DEFAULT NULL COMMENT '作った人',
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Groups';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_codes`
--

DROP TABLE IF EXISTS `role_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_codes` (
  `role_code` varchar(30) NOT NULL COMMENT '役割のコード',
  `role_name` varchar(30) DEFAULT NULL COMMENT '役割の名前',
  PRIMARY KEY (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='role_codes';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_codes`
--

LOCK TABLES `role_codes` WRITE;
/*!40000 ALTER TABLE `role_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `shift_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'シフトID',
  `user_id` int(11) DEFAULT NULL COMMENT 'ユーザーID',
  `dept_id` int(11) DEFAULT NULL COMMENT 'deptID',
  `work_date` datetime DEFAULT NULL COMMENT '仕事の概要',
  `start_time` time DEFAULT NULL COMMENT '始めた時間',
  `end_time` time DEFAULT NULL COMMENT '終わった時間',
  `actual_hours` float DEFAULT NULL COMMENT '実際の時間',
  `status` varchar(30) DEFAULT NULL COMMENT '状況',
  `busy_day_flag` tinyint(1) DEFAULT NULL COMMENT '忙しいかどうか',
  `bonus_pt` float DEFAULT NULL COMMENT 'ボーナスポイント',
  `created_at` datetime DEFAULT NULL COMMENT '作った日',
  `upated_at` datetime DEFAULT NULL COMMENT 'アップデートした日',
  PRIMARY KEY (`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='shifts';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES
(1,1,NULL,'2026-10-25 09:00:00','09:00:00','18:00:00',NULL,'approved',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_points`
--

DROP TABLE IF EXISTS `task_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_points` (
  `point_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ポイントのID',
  `task_id` int(11) DEFAULT NULL COMMENT 'タスクのID',
  `base_point` float DEFAULT NULL COMMENT '基本ポイント',
  `business_multiplier` float DEFAULT NULL COMMENT 'ビジネスレベル',
  `difficulty_multiplier` float DEFAULT NULL COMMENT '難しさレベル',
  `role_factor` float DEFAULT NULL COMMENT '役割',
  `addition_point` float DEFAULT NULL COMMENT '加算ポイント',
  `total_point` float DEFAULT NULL COMMENT 'すべてのポイント',
  `calclated_at` datetime DEFAULT NULL COMMENT '足した日',
  PRIMARY KEY (`point_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='task_points';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_points`
--

LOCK TABLES `task_points` WRITE;
/*!40000 ALTER TABLE `task_points` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) DEFAULT 1,
  `department_id` int(11) DEFAULT 1,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty_level` int(11) DEFAULT 1,
  `discomfort_level` int(11) DEFAULT 1,
  `estimated_hours` decimal(4,1) DEFAULT 1.0,
  `calculated_burden_pts` int(11) DEFAULT 10,
  `status` varchar(20) DEFAULT '未着手',
  `due_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ユーザーID',
  `display_name` varchar(30) DEFAULT NULL COMMENT '表示名',
  `email` varchar(30) DEFAULT NULL COMMENT 'メールアドレス',
  `password_hash` varchar(30) DEFAULT NULL COMMENT 'パスワードハッシュ',
  `role_code` varchar(30) DEFAULT NULL COMMENT '役職コード',
  `job_title` varchar(30) DEFAULT NULL COMMENT '仕事タイトル',
  `level_factor` float DEFAULT NULL COMMENT 'レベル要素',
  `created_at` datetime DEFAULT NULL COMMENT '作られた日',
  `updated_at` datetime DEFAULT NULL COMMENT 'アップデートされた日',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='users';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workload_scores`
--

DROP TABLE IF EXISTS `workload_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workload_scores` (
  `score_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'スコアID',
  `user_id` int(11) DEFAULT NULL COMMENT 'ユーザーID',
  `period_start` date DEFAULT NULL COMMENT '期間スタート',
  `period_end` date DEFAULT NULL COMMENT '期間終わり',
  `task_pt` float DEFAULT NULL COMMENT 'タスクのポイント',
  `shift_pt` float DEFAULT NULL COMMENT 'シフトのポイント',
  `busy_day_pt` float DEFAULT NULL COMMENT '一日の忙しさポイント',
  `total_score` float DEFAULT NULL COMMENT 'すべてのスコア',
  `rank` int(11) DEFAULT NULL COMMENT 'ランク',
  `calculated_at` datetime DEFAULT NULL COMMENT '足した日',
  PRIMARY KEY (`score_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='workload_scores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workload_scores`
--

LOCK TABLES `workload_scores` WRITE;
/*!40000 ALTER TABLE `workload_scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `workload_scores` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-22 10:49:53
