import prisma from "./lib/prisma";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("test123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "ProPlayer",
        email: "pro@test.com",
        passwordHash,
        rank: 8500,
        region: "Europe West",
        rolePrefs: JSON.stringify(["Mid Lane", "Safe Lane"]),
        languages: JSON.stringify(["English", "Russian"]),
        bio: "Professional mid player, looking for serious team",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "SupportGod",
        email: "support@test.com",
        passwordHash,
        rank: 6200,
        region: "Europe East",
        rolePrefs: JSON.stringify(["Hard Support", "Soft Support"]),
        languages: JSON.stringify(["English"]),
        bio: "Pos 5 main, 6.2k MMR",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "CarryPlayer",
        email: "carry@test.com",
        passwordHash,
        rank: 7200,
        region: "Russia",
        rolePrefs: JSON.stringify(["Safe Lane"]),
        languages: JSON.stringify(["Russian", "English"]),
        bio: "Looking for pos 5 duo",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "OfflaneKing",
        email: "offlane@test.com",
        passwordHash,
        rank: 5500,
        region: "US East",
        rolePrefs: JSON.stringify(["Offlane"]),
        languages: JSON.stringify(["English", "Spanish"]),
        bio: "Offlane/tank player",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "FlexPlayer",
        email: "flex@test.com",
        passwordHash,
        rank: 4800,
        region: "Southeast Asia",
        rolePrefs: JSON.stringify(["Safe Lane", "Mid Lane", "Offlane"]),
        languages: JSON.stringify(["English", "Chinese"]),
        bio: "Flexible player, can play any role",
        isLooking: false,
      },
    }),
    prisma.user.create({
      data: {
        username: "TeamCaptain",
        email: "captain@test.com",
        passwordHash,
        rank: 7000,
        region: "Europe West",
        rolePrefs: JSON.stringify(["Offlane", "Safe Lane"]),
        languages: JSON.stringify(["English"]),
        bio: "Team captain, looking for dedicated players",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "NewbiePlayer",
        email: "newbie@test.com",
        passwordHash,
        rank: 1500,
        region: "Russia",
        rolePrefs: JSON.stringify(["Safe Lane"]),
        languages: JSON.stringify(["Russian"]),
        bio: "New player, learning the game",
        isLooking: true,
        lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        username: "Veteran",
        email: "veteran@test.com",
        passwordHash,
        rank: 9500,
        region: "Europe West",
        rolePrefs: JSON.stringify(["Mid Lane", "Hard Support"]),
        languages: JSON.stringify(["English", "German", "French"]),
        bio: "Playing since 2014, Immortal rank",
        isLooking: false,
      },
    }),
  ]);

  const team1 = await prisma.team.create({
    data: {
      name: "Shadow Legion",
      tag: "SL",
      description: "Serious team competing in amateur tournaments",
      captainId: users[0].id,
      members: {
        create: [
          { userId: users[0].id, role: "CAPTAIN" },
          { userId: users[1].id, role: "MEMBER" },
          { userId: users[2].id, role: "MEMBER" },
        ],
      },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: "Phoenix Rising",
      tag: "PR",
      description: "New team looking for more members",
      captainId: users[5].id,
      members: {
        create: [
          { userId: users[5].id, role: "CAPTAIN" },
          { userId: users[3].id, role: "VICE_CAPTAIN" },
        ],
      },
    },
  });

  await prisma.teamInvitation.create({
    data: {
      teamId: team1.id,
      userId: users[3].id,
      message: "We need an offlaner!",
    },
  });

  await prisma.teamJoinRequest.create({
    data: {
      teamId: team2.id,
      userId: users[6].id,
      message: "I want to improve and play with experienced players",
    },
  });

  await prisma.message.create({
    data: {
      chatType: "TEAM",
      chatId: `team:${team1.id}`,
      senderId: users[0].id,
      content: "Welcome to the team everyone!",
    },
  });

  await prisma.message.create({
    data: {
      chatType: "TEAM",
      chatId: `team:${team1.id}`,
      senderId: users[1].id,
      content: "Thanks! When is the next practice?",
    },
  });

  await prisma.notification.create({
    data: {
      userId: users[5].id,
      type: "join_request",
      title: "New Join Request",
      content: "NewbiePlayer wants to join Phoenix Rising",
      link: `/teams/${team2.id}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: users[3].id,
      type: "team_invite",
      title: "Team Invitation",
      content: "Shadow Legion invited you to join!",
      link: `/teams/${team1.id}`,
    },
  });

  const friendReq = await prisma.friendRequest.create({
    data: {
      senderId: users[0].id,
      receiverId: users[5].id,
    },
  });

  await prisma.friendship.create({
    data: {
      userId: users[0].id,
      friendId: users[1].id,
    },
  });

  await prisma.clanWar.create({
    data: {
      team1Id: team1.id,
      team2Id: team2.id,
      message: "Let's have a friendly scrim this weekend!",
    },
  });

  console.log("Seed complete!");
  console.log("---");
  console.log("Test accounts (password: test123):");
  console.log("  pro@test.com - ProPlayer (8.5k, Captain of SL)");
  console.log("  support@test.com - SupportGod");
  console.log("  carry@test.com - CarryPlayer");
  console.log("  offlane@test.com - OfflaneKing");
  console.log("  captain@test.com - TeamCaptain (Captain of PR)");
  console.log("  newbie@test.com - NewbiePlayer");
  console.log("  veteran@test.com - Veteran");
  console.log("  flex@test.com - FlexPlayer");
  console.log("---");
  console.log("Teams: Shadow Legion [SL], Phoenix Rising [PR]");
}

if (process.env.SEED_RUN) {
  seed().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
}

export { seed };
