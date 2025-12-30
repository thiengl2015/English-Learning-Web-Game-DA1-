// 1. Đảm bảo Import Models ở ngay dòng đầu tiên
const { Unit, Lesson, LessonProgress } = require("../models");

class UnitService {
  
  // ... (Giữ nguyên các hàm getAllUnits, getUnitById, getUnitStatistics cũ của bạn) ...
  async getAllUnits(userId) { /* ... code cũ ... */ }
  async getUnitById(unitId, userId) { /* ... code cũ ... */ }
  async getUnitStatistics(unitId, userId) { /* ... code cũ ... */ }

  // --- HÀM GÂY LỖI 500 ĐÃ ĐƯỢC SỬA LẠI ---
  async getLessonsByUnit(unitId, userId) {
    try {
      console.log(`[Service] Đang lấy lessons cho Unit: ${unitId}, User: ${userId}`);

      // Bước 1: Query Lessons
      // Sử dụng findAll với where đơn giản để tránh lỗi cú pháp
      const lessons = await Lesson.findAll({
        where: { unit_id: unitId },
        order: [["order_index", "ASC"]],
      });

      console.log(`[Service] Tìm thấy ${lessons.length} bài học.`);

      if (!lessons || lessons.length === 0) {
        return [];
      }

      // Bước 2: Query Progress
      const progress = await LessonProgress.findAll({
        where: { 
          user_id: userId,
          unit_id: unitId 
        }
      });

      // Bước 3: Map dữ liệu an toàn
      const result = lessons.map((lesson, index) => {
        const lessonData = lesson.toJSON ? lesson.toJSON() : lesson;
        
        // Tìm progress của bài hiện tại
        const currentProgress = progress.find(p => p.lesson_id === lessonData.id);
        const isCompleted = currentProgress ? currentProgress.status === 'completed' : false;
        
        // Logic mở khóa: Bài đầu (index 0) luôn mở. 
        // Các bài sau mở khi bài liền trước (index - 1) đã completed.
        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const prevLessonId = lessons[index - 1].id;
          const prevProgress = progress.find(p => p.lesson_id === prevLessonId);
          isUnlocked = prevProgress ? prevProgress.status === 'completed' : false;
        }

        return {
          id: lessonData.id,
          title: lessonData.title,
          type: lessonData.type,
          completed: isCompleted,
          stars: currentProgress ? currentProgress.stars_earned : 0,
          // Frontend cần 'position' để vẽ map, tạm thời fake nếu DB chưa có
          position: { x: 50, y: 50 }, 
          is_unlocked: isUnlocked
        };
      });

      return result;

    } catch (error) {
      // QUAN TRỌNG: In lỗi chi tiết ra Terminal của Backend để biết tại sao sai
      console.error("!!! LỖI TẠI getLessonsByUnit !!!", error);
      throw error; // Ném lỗi để Controller bắt được
    }
  }
}

module.exports = new UnitService();