'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('notification_templates', [
      {
        event: 'top_3_rank',
        title: 'Congratulations!',
        body: 'Hey [username], you reached Top 3 on the leaderboard this week!',
        variables: JSON.stringify(['username']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'rank_up',
        title: 'Rank Up!',
        body: '[username] has leveled up to [new_rank]! Keep going!',
        variables: JSON.stringify(['username', 'new_rank']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'rank_down',
        title: 'Keep Practising',
        body: 'Your rank dropped to [new_rank]. Don\'t give up, [username]!',
        variables: JSON.stringify(['username', 'new_rank']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'premium_purchase',
        title: 'Welcome to Premium!',
        body: 'Hi [username], your Premium subscription is now active. Enjoy all features!',
        variables: JSON.stringify(['username']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'friend_request',
        title: 'New Friend Request',
        body: '[sender] wants to be your friend!',
        variables: JSON.stringify(['sender']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'achievement',
        title: 'Achievement Unlocked!',
        body: 'You earned the \'[achievement_name]\' badge, [username]!',
        variables: JSON.stringify(['username', 'achievement_name']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        event: 'feedback_received',
        title: 'Feedback Received',
        body: 'Thanks [username], your feedback has been submitted successfully.',
        variables: JSON.stringify(['username']),
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notification_templates', null, {});
  },
};
