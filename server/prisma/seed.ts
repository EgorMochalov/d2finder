import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const REGIONS = ['Europe West', 'Europe East', 'Russia', 'US East', 'SE Asia'];
const LANGUAGES = ['English', 'Russian', 'Spanish', 'Portuguese', 'Chinese'];
const ROLES = ['["Pos 1"]', '["Pos 2"]', '["Pos 3"]', '["Pos 4"]', '["Pos 5"]', '["Pos 1","Pos 2"]', '["Pos 3","Pos 4"]', '["Pos 4","Pos 5"]'];

const users = [
  { username: 'ShadowFiend', rank: 4200, region: 'Europe West', languages: '["English","Russian"]', rolePrefs: '["Pos 2"]' },
  { username: 'CrystalMaiden', rank: 3100, region: 'Russia', languages: '["Russian"]', rolePrefs: '["Pos 5"]' },
  { username: 'InvokerKing', rank: 5600, region: 'Europe West', languages: '["English"]', rolePrefs: '["Pos 2","Pos 1"]' },
  { username: 'PudgeHook', rank: 2500, region: 'US East', languages: '["English","Spanish"]', rolePrefs: '["Pos 4"]' },
  { username: 'AntiMage', rank: 4800, region: 'SE Asia', languages: '["English","Chinese"]', rolePrefs: '["Pos 1"]' },
  { username: 'EarthSpirit', rank: 6200, region: 'Europe East', languages: '["Russian","English"]', rolePrefs: '["Pos 4","Pos 3"]' },
  { username: 'Juggernaut', rank: 3500, region: 'Russia', languages: '["Russian"]', rolePrefs: '["Pos 1"]' },
  { username: 'RubickPro', rank: 5100, region: 'Europe West', languages: '["English","French"]', rolePrefs: '["Pos 5","Pos 4"]' },
  { username: 'TinkerBot', rank: 4400, region: 'US East', languages: '["English"]', rolePrefs: '["Pos 2"]' },
  { username: 'Linafire', rank: 2800, region: 'SE Asia', languages: '["English","Chinese"]', rolePrefs: '["Pos 2","Pos 5"]' },
  { username: 'AxeCutter', rank: 3900, region: 'Europe East', languages: '["Russian","English"]', rolePrefs: '["Pos 3"]' },
  { username: 'PhoenixBird', rank: 5300, region: 'Europe West', languages: '["English","German"]', rolePrefs: '["Pos 4","Pos 5"]' },
];

const teamDefs = [
  { name: 'Radiant Force', tag: 'RF', desc: 'Competitive team looking for pos 1-2 players. Divine+ rank required.' },
  { name: 'Dark Alliance', tag: 'DA', desc: 'Casual team for evening games. All ranks welcome.' },
  { name: 'Slavic Bears', tag: 'SB', desc: 'Русскоязычная команда. Ищем саппортов.' },
  { name: 'Team Spirit EU', tag: 'TSE', desc: 'Ancient+ team for ranked and tournaments.' },
  { name: 'New Horizons', tag: 'NH', desc: 'Teaching team for new and returning players.' },
];

async function main() {
  const hash = await bcrypt.hash('test123', 10);

  // Clean existing data
  await prisma.clanWarLooking.deleteMany();
  await prisma.clanWar.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.teamJoinRequest.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const createdUsers = await Promise.all(
    users.map((u, i) =>
      prisma.user.create({
        data: {
          ...u,
          email: `player${i + 1}@d2finder.test`,
          passwordHash: hash,
          bio: `Dota 2 player. ${u.rank} MMR. Looking for reliable teammates.`,
        },
      })
    )
  );

  // Create teams
  const teams: any[] = [];
  for (let i = 0; i < teamDefs.length; i++) {
    const td = teamDefs[i];
    const captainIdx = i % createdUsers.length;
    const team = await prisma.team.create({
      data: {
        name: td.name,
        tag: td.tag,
        description: td.desc,
        captainId: createdUsers[captainIdx].id,
      },
    });

    // Add captain as member
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: createdUsers[captainIdx].id, role: 'CAPTAIN' },
    });

    // Add 2-4 members
    const memberCount = 2 + (i % 3);
    for (let j = 0; j < memberCount; j++) {
      const memberIdx = (captainIdx + 1 + j) % createdUsers.length;
      if (memberIdx === captainIdx) continue;
      try {
        await prisma.teamMember.create({
          data: { teamId: team.id, userId: createdUsers[memberIdx].id, role: 'MEMBER' },
        });
      } catch { /* ignore duplicates */ }
    }

    teams.push(team);
  }

  // Clan war looking posts
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const author = createdUsers[i % createdUsers.length];
    if (i % 2 === 0) {
      await prisma.clanWarLooking.create({
        data: {
          teamId: t.id,
          authorId: author.id,
          description: `Team ${t.name} is looking for a scrim!`,
          timeText: '20:00 MSK',
          dateText: 'Weekends',
          rankReq: 'Ancient+',
          mmrReq: 4000,
        },
      });
    }
  }

  // Seed some messages
  for (let i = 0; i < createdUsers.length - 1; i++) {
    const from = createdUsers[i];
    const to = createdUsers[i + 1];
    const chatId = [from.id, to.id].sort().join('_');
    await prisma.message.create({
      data: {
        chatType: 'PRIVATE',
        chatId,
        senderId: from.id,
        content: `Hey! I saw you're looking for teammates. I play pos ${(i % 5) + 1}. Want to party?`,
      },
    });
    await prisma.message.create({
      data: {
        chatType: 'PRIVATE',
        chatId,
        senderId: to.id,
        content: `Sure! Add me. My rank is ${(to as any).rank}.`,
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log(`  Users: ${createdUsers.length}`);
  console.log(`  Teams: ${teams.length}`);
  console.log(`  Clan war posts: ${Math.ceil(teams.length / 2)}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
