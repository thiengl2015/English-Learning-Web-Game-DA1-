const { Unit, Lesson, Vocabulary } = require("../models");
const { successResponse, errorResponse } = require("../utils/response.util");
const { Op } = require("sequelize");

// Lấy danh sách Unit
exports.getUnits = async (req, res, next) => {
  try {
    const units = await Unit.findAll({
      attributes: [
        "id",
        "title",
        "subtitle",
        "icon",
        "order_index",
        "total_lessons",
        "created_at",
      ],
      order: [["order_index", "ASC"]],
    });

    return successResponse(res, units, "Lấy danh sách unit thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết 1 Unit
exports.getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id, {
      include: [
        {
          model: Lesson,
          as: "lessons",
          attributes: ["id", "title", "type", "order_index", "xp_reward"],
          order: [["order_index", "ASC"]],
        },
        {
          model: Vocabulary,
          as: "vocabulary",
          attributes: ["id", "word", "meaning"],
        },
      ],
    });

    if (!unit) {
      return errorResponse(res, "Unit not found", 404);
    }

    return successResponse(res, unit, "Lấy thông tin unit thành công");
  } catch (error) {
    next(error);
  }
};

// Tạo Unit mới
exports.createUnit = async (req, res, next) => {
  try {
    const { title, subtitle, icon, order_index, total_lessons } = req.body;

    if (!title || !order_index) {
      return errorResponse(res, "Title and order_index are required", 400);
    }

    const existing = await Unit.findOne({ where: { order_index } });
    if (existing) {
      return errorResponse(res, "Unit with this order_index already exists", 400);
    }

    const unit = await Unit.create({
      title,
      subtitle: subtitle || null,
      icon: icon || null,
      order_index,
      total_lessons: total_lessons || 15,
    });

    return successResponse(res, unit, "Unit created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Cập nhật Unit
exports.updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, icon, order_index, total_lessons } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return errorResponse(res, "Unit not found", 404);
    }

    if (order_index && order_index !== unit.order_index) {
      const existing = await Unit.findOne({ where: { order_index } });
      if (existing) {
        return errorResponse(res, "Unit with this order_index already exists", 400);
      }
    }

    await unit.update({
      title: title !== undefined ? title : unit.title,
      subtitle: subtitle !== undefined ? subtitle : unit.subtitle,
      icon: icon !== undefined ? icon : unit.icon,
      order_index: order_index !== undefined ? order_index : unit.order_index,
      total_lessons: total_lessons !== undefined ? total_lessons : unit.total_lessons,
    });

    return successResponse(res, unit, "Unit updated successfully");
  } catch (error) {
    next(error);
  }
};

// Xoá Unit
exports.deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return errorResponse(res, "Unit not found", 404);
    }

    await unit.destroy();

    return successResponse(res, null, "Unit deleted successfully");
  } catch (error) {
    next(error);
  }
};
