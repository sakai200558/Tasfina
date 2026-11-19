-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: Tasfina_db
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.24.04.4

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_types` (
  `type_code` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'タイプコード',
  `type_name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'タイプの名前',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `busy_day_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT COMMENT '設定のid',
  `date` date DEFAULT NULL COMMENT 'データ',
  `required_peple` int DEFAULT NULL COMMENT '一回きりの',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_members` (
  `dm_id` int NOT NULL AUTO_INCREMENT COMMENT 'DMのID',
  `user_id` int DEFAULT NULL COMMENT 'ユーザーID',
  `dept_id` int DEFAULT NULL COMMENT 'deptのID',
  `joined_at` datetime DEFAULT NULL COMMENT '入った日',
  PRIMARY KEY (`dm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='department_members';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_members`
--

LOCK TABLES `department_members` WRITE;
/*!40000 ALTER TABLE `department_members` DISABLE KEYS */;
INSERT INTO `department_members` VALUES (1,13,1,'2026-11-12 01:57:27'),(2,14,2,'2026-11-13 01:03:41'),(3,15,3,'2026-11-13 10:28:07'),(4,16,4,'2026-11-19 01:40:54');
/*!40000 ALTER TABLE `department_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `dept_id` int NOT NULL AUTO_INCREMENT COMMENT 'デパートメントID',
  `group_id` int DEFAULT NULL COMMENT 'グループID',
  `dept_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'デパートメントの名前',
  `dept_code` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'デパートメントのコード',
  `parent_dept_id` int DEFAULT NULL COMMENT '親デパートメントのID',
  `leader_id` int DEFAULT NULL COMMENT 'リーダーID',
  `created_at` datetime DEFAULT NULL COMMENT '作られた日',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='departments';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,NULL,NULL,NULL,NULL,NULL),(2,2,NULL,NULL,NULL,NULL,NULL),(3,3,NULL,NULL,NULL,NULL,NULL),(4,4,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `difficulties`
--

DROP TABLE IF EXISTS `difficulties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `difficulties` (
  `difficulty_code` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'difficulty_code',
  `difficulty_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'difficulty_name',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixed_additions` (
  `addition_code` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT '追加コード',
  `addition_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '追加名前',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_titiles` (
  `job_title` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT '仕事のタイトル',
  `job_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '仕事名',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `group_id` int NOT NULL AUTO_INCREMENT COMMENT 'グループのID',
  `group_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'グループの名前',
  `owner_id` int DEFAULT NULL COMMENT 'オーナーのID',
  `created_at` datetime DEFAULT NULL COMMENT '作った人',
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Groups';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member`
--

LOCK TABLES `member` WRITE;
/*!40000 ALTER TABLE `member` DISABLE KEYS */;
INSERT INTO `member` VALUES (1,'gggggggのグループ',13,'2026-11-12 01:57:27'),(2,'yarimasuneのグループ',14,'2026-11-13 01:03:41'),(3,'asdfのグループ',15,'2026-11-13 10:28:07'),(4,'酒井のグループ',16,'2026-11-19 01:40:54');
/*!40000 ALTER TABLE `member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_codes`
--

DROP TABLE IF EXISTS `role_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_codes` (
  `role_code` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT '役割のコード',
  `role_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '役割の名前',
  `group_id` int DEFAULT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `shift_id` int NOT NULL AUTO_INCREMENT COMMENT 'シフトID',
  `user_id` int DEFAULT NULL COMMENT 'ユーザーID',
  `dept_id` int DEFAULT NULL COMMENT 'deptID',
  `work_date` datetime DEFAULT NULL COMMENT '仕事の概要',
  `start_time` time DEFAULT NULL COMMENT '始めた時間',
  `end_time` time DEFAULT NULL COMMENT '終わった時間',
  `actual_hours` float DEFAULT NULL COMMENT '実際の時間',
  `status` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '状況',
  `busy_day_flag` tinyint(1) DEFAULT NULL COMMENT '忙しいかどうか',
  `bonus_pt` float DEFAULT NULL COMMENT 'ボーナスポイント',
  `created_at` datetime DEFAULT NULL COMMENT '作った日',
  `updated_at` datetime DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  PRIMARY KEY (`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='shifts';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,1,NULL,'2026-10-25 09:00:00','09:00:00','18:00:00',NULL,'approved',NULL,NULL,NULL,NULL,NULL),(2,13,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-12 01:57:27','2026-11-12 01:57:27',1),(3,14,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-13 01:03:41','2026-11-13 01:03:41',2),(4,15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-13 10:28:07','2026-11-13 10:28:07',3),(5,16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-11-19 01:40:54','2026-11-19 01:40:54',4);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `system_name` varchar(100) DEFAULT 'Tasfina' COMMENT 'システム名',
  `company_name` varchar(100) DEFAULT '株式会社Tasfina' COMMENT '企業名',
  `logo_path` varchar(255) DEFAULT NULL COMMENT 'ロゴ画像の保存パス',
  `timezone` varchar(50) DEFAULT '(UTC+09:00) 東京' COMMENT 'タイムゾーン',
  `week_start` varchar(20) DEFAULT '月曜日' COMMENT '週の開始曜日',
  `date_format` varchar(20) DEFAULT '2024/10/17' COMMENT '日付の表示形式',
  `time_format` varchar(20) DEFAULT '24時間形式（例：09:00）' COMMENT '時間の表示形式',
  `password_min_length` int DEFAULT '8' COMMENT '最小文字数',
  `password_require_uppercase` tinyint(1) DEFAULT '1' COMMENT '必須文字：英大文字',
  `password_require_lowercase` tinyint(1) DEFAULT '1' COMMENT '必須文字：英小文字',
  `password_require_number` tinyint(1) DEFAULT '1' COMMENT '必須文字：数字',
  `password_require_symbol` tinyint(1) DEFAULT '0' COMMENT '必須文字：記号',
  `password_expiry_days` varchar(20) DEFAULT '90日' COMMENT '有効期限',
  `password_history_count` int DEFAULT '5' COMMENT '履歴の保持数',
  `auto_backup` tinyint(1) DEFAULT '1' COMMENT '自動バックアップ (ON/OFF)',
  `backup_retention_days` varchar(20) DEFAULT '30日' COMMENT '保持期間',
  `theme_color` varchar(50) DEFAULT 'blue' COMMENT 'テーマカラー',
  `show_sidebar` tinyint(1) DEFAULT '1' COMMENT 'サイドメニュー表示 (ON/OFF)',
  `show_animations` tinyint(1) DEFAULT '1' COMMENT 'アニメーション効果 (ON/OFF)',
  `items_per_page` int DEFAULT '20' COMMENT '1ページの表示件数',
  `feature_chat` tinyint(1) DEFAULT '1' COMMENT 'チャット機能',
  `feature_file_sharing` tinyint(1) DEFAULT '1' COMMENT 'ファイル共有機能',
  `feature_task` tinyint(1) DEFAULT '1' COMMENT 'タスク管理機能',
  `feature_gantt` tinyint(1) DEFAULT '1' COMMENT 'ガントチャート機能',
  `feature_ranking` tinyint(1) DEFAULT '1' COMMENT 'ランキング機能',
  `feature_org_chart` tinyint(1) DEFAULT '1' COMMENT '組織図機能',
  `feature_lottery` tinyint(1) DEFAULT '1' COMMENT 'シフトルーレット機能',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最終更新日時',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='システム設定管理テーブル';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (16,'Tasfina','株式会社Tasfina',NULL,'(UTC+09:00) 東京','月曜日','2024/10/17','24時間形式（例：09:00）',8,1,1,1,0,'90日',5,1,'30日','blue',1,1,20,1,1,1,1,1,1,1,'2026-11-19 01:40:54');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_points`
--

DROP TABLE IF EXISTS `task_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_points` (
  `point_id` int NOT NULL AUTO_INCREMENT COMMENT 'ポイントのID',
  `task_id` int DEFAULT NULL COMMENT 'タスクのID',
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organization_id` int DEFAULT '1',
  `department_id` int DEFAULT '1',
  `title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `difficulty_level` int DEFAULT '1',
  `discomfort_level` int DEFAULT '1',
  `estimated_hours` decimal(4,1) DEFAULT '1.0',
  `calculated_burden_pts` int DEFAULT '10',
  `status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '未着手',
  `due_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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
-- Table structure for table `user_groups`
--

DROP TABLE IF EXISTS `user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_groups` (
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `group_name` varchar(30) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_groups`
--

LOCK TABLES `user_groups` WRITE;
/*!40000 ALTER TABLE `user_groups` DISABLE KEYS */;
INSERT INTO `user_groups` VALUES (1,13,'gggggggのグループ','2026-11-12 01:57:27'),(2,14,'yarimasuneのグループ','2026-11-13 01:03:41'),(3,15,'asdfのグループ','2026-11-13 10:28:07'),(4,16,'酒井のグループ','2026-11-19 01:40:54');
/*!40000 ALTER TABLE `user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `display_name` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '表示名',
  `email` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'メールアドレス',
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role_code` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '役職コード',
  `job_title` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '仕事タイトル',
  `level_factor` float DEFAULT NULL COMMENT 'レベル要素',
  `created_at` datetime DEFAULT NULL COMMENT '作られた日',
  `updated_at` datetime DEFAULT NULL COMMENT 'アップデートされた日',
  `group_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='users';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,NULL,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',NULL,NULL,0,NULL,NULL,13),(2,NULL,NULL,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',NULL,NULL,0,NULL,NULL,14),(3,NULL,NULL,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',NULL,NULL,0,'2026-10-23 01:32:59',NULL,15),(4,NULL,NULL,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',NULL,NULL,0,'2026-10-23 01:41:45',NULL,16),(5,'asdfda','afsdaf@gmail.com','fe82945b76e4073410f5ddedd1090b69fd943ae758f52bd764a202f03337e9ed','',NULL,0,'2026-10-23 01:43:32',NULL,17),(6,'夏目','tintin@gmail.com','d7b710be38069183069168115df9be4fd8f7dc94c17acc3e70170693e0231912','',NULL,0,'2026-10-23 01:44:40',NULL,18),(7,'aaa','aaa@gmail.com','ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f','',NULL,0,'2026-10-23 01:46:11',NULL,19),(8,'safad','asfsdafdsa@gmaill.com','932f3c1b56257ce8539ac269d7aab42550dacf8818d075f0bdf1990562aae3ef','',NULL,0,'2026-10-23 02:10:28',NULL,20),(9,'aaaaaa','bbb@gmail.com','932f3c1b56257ce8539ac269d7aab42550dacf8818d075f0bdf1990562aae3ef','',NULL,0,'2026-10-29 00:57:46',NULL,21),(10,'eeeee','onanii@gmail.com','932f3c1b56257ce8539ac269d7aab42550dacf8818d075f0bdf1990562aae3ef','',NULL,0,'2026-10-30 03:25:34',NULL,22),(11,'eeeee','onanii@gmail.com','932f3c1b56257ce8539ac269d7aab42550dacf8818d075f0bdf1990562aae3ef','',NULL,0,'2026-10-30 03:25:38',NULL,23),(12,'eeeee','onanii@gmail.com','932f3c1b56257ce8539ac269d7aab42550dacf8818d075f0bdf1990562aae3ef','',NULL,0,'2026-10-30 03:26:55',NULL,24),(13,'ggggggg','8354.tysgggggg@gmail.com','$2y$10$RFYJJqhC42RBFWm4muS0wOcK9vrOM66mPJFnWCeUCsMiS4TFyaie2','',NULL,0,'2026-11-12 01:57:27',NULL,1),(14,'yarimasune','ppp@gmail.com','$2y$10$60N/wIA9A/q7WXrsgrrlO./Y8iYUVySiPbCnr9HF9fymgsJARg4eC','',NULL,0,'2026-11-13 01:03:41',NULL,2),(15,'asdf','asdf@gmail.com','$2y$10$/cot2R4vkxFOL9CN1fVv2.KDWAYFFESguIFwlwX3ot1.NziuJx17a','',NULL,0,'2026-11-13 10:28:07',NULL,3),(16,'酒井','sakai@tinko.com','$2y$10$rStlJPfM.U86ZMRo5KGMF.ndVbw6nTOcKtto4QVgt9pUKYhUHrV7q','',NULL,0,'2026-11-19 01:40:54',NULL,4);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workload_scores`
--

DROP TABLE IF EXISTS `workload_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workload_scores` (
  `score_id` int NOT NULL AUTO_INCREMENT COMMENT 'スコアID',
  `user_id` int DEFAULT NULL COMMENT 'ユーザーID',
  `period_start` date DEFAULT NULL COMMENT '期間スタート',
  `period_end` date DEFAULT NULL COMMENT '期間終わり',
  `task_pt` float DEFAULT NULL COMMENT 'タスクのポイント',
  `shift_pt` float DEFAULT NULL COMMENT 'シフトのポイント',
  `busy_day_pt` float DEFAULT NULL COMMENT '一日の忙しさポイント',
  `total_score` float DEFAULT NULL COMMENT 'すべてのスコア',
  `rank` int DEFAULT NULL COMMENT 'ランク',
  `calculated_at` datetime DEFAULT NULL COMMENT '足した日',
  `group_id` int DEFAULT NULL,
  PRIMARY KEY (`score_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='workload_scores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workload_scores`
--

LOCK TABLES `workload_scores` WRITE;
/*!40000 ALTER TABLE `workload_scores` DISABLE KEYS */;
INSERT INTO `workload_scores` VALUES (1,13,NULL,NULL,0,0,0,0,NULL,NULL,1),(2,14,NULL,NULL,0,0,0,0,NULL,NULL,2),(3,15,NULL,NULL,0,0,0,0,NULL,NULL,3),(4,16,NULL,NULL,0,0,0,0,NULL,NULL,4);
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

-- Dump completed on 2026-11-19 10:42:27
