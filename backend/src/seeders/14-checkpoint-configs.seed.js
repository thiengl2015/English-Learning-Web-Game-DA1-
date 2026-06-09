"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const checkpointConfigs = [
      {
        id: "checkpoint-1",
        test_type: "checkpoint",
        title: "Checkpoint 1: Units 1-5",
        description: "Test covering Units 1 to 5. Pass with 80% to unlock Units 6-10.",
        units_covered: JSON.stringify([1, 2, 3, 4, 5]),
        unit_id: null,
        pass_threshold: 80,
        total_score: 20,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: "checkpoint-2",
        test_type: "checkpoint",
        title: "Checkpoint 2: Units 6-10",
        description: "Test covering Units 6 to 10. Pass with 80% to complete the course.",
        units_covered: JSON.stringify([6, 7, 8, 9, 10]),
        unit_id: null,
        pass_threshold: 80,
        total_score: 20,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    const challengeConfigs = Array.from({ length: 12 }, (_, index) => {
      const unitId = index + 1;
      return {
        id: `unit-${unitId}`,
        test_type: "challenge",
        title: `Unit ${unitId} Challenge`,
        description:
          "10-question challenge. Pass only with 10/10 to mark all unit lessons complete with 3 stars each.",
        units_covered: null,
        unit_id: unitId,
        pass_threshold: 100,
        total_score: 10,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
    });

    const configs = [...checkpointConfigs, ...challengeConfigs];

    for (const config of configs) {
      await queryInterface.insert(null, "unit_test_configs", config, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("unit_test_configs", {
      test_type: ["checkpoint", "challenge"],
    }, {});
  },
};
