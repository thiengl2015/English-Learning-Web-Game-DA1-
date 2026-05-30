const { PracticeTopic, PracticeItem } = require("../models");
const { Op } = require("sequelize");

const topicMeta = [
  {
    slug: "greetings",
    title: "Greetings",
    emoji: "\u{1F44B}",
    color: "from-violet-500 to-purple-600",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=greetings",
  },
  {
    slug: "daily-activities",
    title: "Daily Activities",
    emoji: "\u{1F3C3}",
    color: "from-cyan-500 to-blue-600",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=daily",
  },
  {
    slug: "animals",
    title: "Animals",
    emoji: "\u{1F98A}",
    color: "from-emerald-500 to-green-600",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=animals",
  },
  {
    slug: "food",
    title: "Food & Drinks",
    emoji: "\u{1F34E}",
    color: "from-orange-500 to-amber-600",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=food",
  },
  {
    slug: "sports",
    title: "Sports",
    emoji: "\u26BD",
    color: "from-pink-500 to-rose-600",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sports",
  },
];

const descriptions = {
  "listen-fill": {
    greetings: "Listen and fill in common greeting phrases",
    "daily-activities": "Listen and fill in words about daily routines",
    animals: "Listen and fill in names of animals",
    food: "Listen and fill in names of food and drinks",
    sports: "Listen and fill in sports vocabulary",
  },
  "listen-repeat": {
    greetings: "Listen and repeat common greeting phrases",
    "daily-activities": "Listen and repeat words about daily routines",
    animals: "Listen and repeat names of animals",
    food: "Listen and repeat names of food and drinks",
    sports: "Listen and repeat sports vocabulary",
  },
  "read-answer": {
    greetings: "Read short passages and choose true or false",
    "daily-activities": "Read daily routine passages and choose true or false",
    animals: "Read animal passages and choose true or false",
    food: "Read food passages and choose true or false",
    sports: "Read sport passages and choose true or false",
  },
  "read-story": {
    greetings: "Enjoy greeting stories for reading practice",
    "daily-activities": "Enjoy daily routine stories for reading practice",
    animals: "Enjoy animal stories for reading practice",
    food: "Enjoy food stories for reading practice",
    sports: "Enjoy sport stories for reading practice",
  },
};

function text(content) {
  return { type: "text", content };
}

function blank(id, answer) {
  return { type: "blank", id, answer };
}

function fillItem(title, imageSeed, segments) {
  const audioText = segments.map((segment) => (segment.type === "blank" ? segment.answer : segment.content)).join("");
  return {
    title,
    image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${imageSeed}`,
    audio_text: audioText,
    passage: audioText,
    content_data: { segments },
  };
}

function qaItem(passage, questions) {
  return {
    passage,
    content_data: { questions },
  };
}

function storyItem(title, imageSeed, english, vietnamese) {
  return {
    title,
    image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${imageSeed}`,
    passage: english,
    translation: vietnamese,
    content_data: { english, vietnamese },
  };
}

const listenFill = {
  greetings: [
    fillItem("Good Morning", "lf-greeting-1", [text("Every morning I say "), blank("b1", "hello"), text(" to my teacher. She smiles and says "), blank("b2", "good"), text(" morning back.")]),
    fillItem("Polite Words", "lf-greeting-2", [text("When I need help, I say "), blank("b1", "please"), text(". When my friend helps me, I say "), blank("b2", "thank"), text(" you.")]),
    fillItem("Saying Goodbye", "lf-greeting-3", [text("After school, we wave and say "), blank("b1", "goodbye"), text(". My teacher says, see you "), blank("b2", "tomorrow"), text(".")]),
    fillItem("Meeting Friends", "lf-greeting-4", [text("I meet a new friend and say nice to "), blank("b1", "meet"), text(" you. She says welcome to our "), blank("b2", "class"), text(".")]),
  ],
  "daily-activities": [
    fillItem("Morning Routine", "daily", [text("Every morning I "), blank("b1", "wake"), text(" up at seven o'clock. I "), blank("b2", "brush"), text(" my teeth and "), blank("b3", "wash"), text(" my face.")]),
    fillItem("Going to School", "daily2", [text("After breakfast I "), blank("b1", "go"), text(" to school by "), blank("b2", "bus"), text(". Classes "), blank("b3", "start"), text(" at eight thirty.")]),
    fillItem("Afternoon", "daily3", [text("In the afternoon I "), blank("b1", "do"), text(" my homework. Then I "), blank("b2", "play"), text(" outside with my "), blank("b3", "friends"), text(".")]),
    fillItem("Night Routine", "daily4", [text("At night I "), blank("b1", "eat"), text(" dinner with my family and "), blank("b2", "watch"), text(" TV. I "), blank("b3", "sleep"), text(" at ten o'clock.")]),
  ],
  animals: [
    fillItem("Lions", "animals1", [text("Lions are called the "), blank("b1", "king"), text(" of the jungle. They "), blank("b2", "hunt"), text(" in groups called "), blank("b3", "prides"), text(".")]),
    fillItem("Elephants", "animals2", [text("Elephants are the largest "), blank("b1", "land"), text(" animals. They use their "), blank("b2", "trunks"), text(" to "), blank("b3", "drink"), text(" water.")]),
    fillItem("Dolphins", "animals3", [text("Dolphins are very "), blank("b1", "smart"), text(" animals. They "), blank("b2", "live"), text(" in the "), blank("b3", "ocean"), text(".")]),
    fillItem("Penguins", "animals4", [text("Penguins cannot "), blank("b1", "fly"), text(" but they are excellent "), blank("b2", "swimmers"), text(". They "), blank("b3", "live"), text(" in Antarctica.")]),
  ],
  food: [
    fillItem("Healthy Food", "food1", [text("Eating "), blank("b1", "fruits"), text(" and vegetables is good for our "), blank("b2", "health"), text(". We should eat them every "), blank("b3", "day"), text(".")]),
    fillItem("Strong Bones", "food2", [text("Milk gives us strong "), blank("b1", "bones"), text(". Meat and eggs give us "), blank("b2", "protein"), text(" to "), blank("b3", "grow"), text(".")]),
    fillItem("Water", "food3", [text("Too much "), blank("b1", "sugar"), text(" is bad for our teeth. We should "), blank("b2", "drink"), text(" plenty of "), blank("b3", "water"), text(" instead.")]),
    fillItem("Energy", "food4", [text("A "), blank("b1", "balanced"), text(" diet keeps us "), blank("b2", "healthy"), text(" and gives us "), blank("b3", "energy"), text(".")]),
  ],
  sports: [
    fillItem("Football", "sports1", [text("In football, players "), blank("b1", "kick"), text(" the ball and try to score a "), blank("b2", "goal"), text(".")]),
    fillItem("Basketball", "sports2", [text("In basketball, players "), blank("b1", "throw"), text(" the ball into a "), blank("b2", "hoop"), text(".")]),
    fillItem("Swimming", "sports3", [text("Swimming is good "), blank("b1", "exercise"), text(". You move your whole "), blank("b2", "body"), text(" in the water.")]),
    fillItem("Tennis", "sports4", [text("Tennis players use a "), blank("b1", "racket"), text(" and hit the ball over a "), blank("b2", "net"), text(".")]),
  ],
};

const repeatCards = {
  greetings: {
    prompt: "I like to say...",
    cards: [
      ["hello", "hello", "\u{1F44B}"],
      ["goodbye", "goodbye", "\u{1F64B}"],
      ["thank you", "thank you", "\u{1F64F}"],
      ["sorry", "sorry", "\u{1F614}"],
      ["please", "please", "\u{1F97A}"],
      ["welcome", "welcome", "\u{1F917}"],
    ],
  },
  "daily-activities": {
    prompt: "Every day I...",
    cards: [
      ["riding a bike", "riding a bike", "\u{1F6B4}"],
      ["swimming", "swimming", "\u{1F3CA}"],
      ["reading", "reading", "\u{1F4D6}"],
      ["cooking", "cooking", "\u{1F373}"],
      ["sleeping", "sleeping", "\u{1F634}"],
      ["running", "running", "\u{1F3C3}"],
    ],
  },
  animals: {
    prompt: "I can see a...",
    cards: [
      ["cat", "cat", "\u{1F431}"],
      ["dog", "dog", "\u{1F436}"],
      ["fox", "fox", "\u{1F98A}"],
      ["bear", "bear", "\u{1F43B}"],
      ["rabbit", "rabbit", "\u{1F430}"],
      ["elephant", "elephant", "\u{1F418}"],
    ],
  },
  food: {
    prompt: "I want to eat...",
    cards: [
      ["apple", "apple", "\u{1F34E}"],
      ["banana", "banana", "\u{1F34C}"],
      ["pizza", "pizza", "\u{1F355}"],
      ["cake", "cake", "\u{1F382}"],
      ["milk", "milk", "\u{1F95B}"],
      ["bread", "bread", "\u{1F35E}"],
    ],
  },
  sports: {
    prompt: "I love playing...",
    cards: [
      ["football", "football", "\u26BD"],
      ["basketball", "basketball", "\u{1F3C0}"],
      ["tennis", "tennis", "\u{1F3BE}"],
      ["baseball", "baseball", "\u26BE"],
      ["volleyball", "volleyball", "\u{1F3D0}"],
      ["swimming", "swimming", "\u{1F3CA}"],
    ],
  },
};

const readAnswer = {
  greetings: [
    qaItem("Hello! My name is Tom. I am eight years old. I go to school every day. I like to say hello to my friends. I always say thank you when someone helps me.", [
      { id: 1, statement: "Tom is ten years old.", answer: false },
      { id: 2, statement: "Tom goes to school every day.", answer: true },
      { id: 3, statement: "Tom says thank you when someone helps him.", answer: true },
    ]),
    qaItem("Good morning! Anna wakes up at seven o'clock. She says good morning to her mum and dad. She eats breakfast and goes to school. She says goodbye before she leaves.", [
      { id: 1, statement: "Anna wakes up at eight o'clock.", answer: false },
      { id: 2, statement: "Anna says good morning to her parents.", answer: true },
      { id: 3, statement: "Anna says goodbye before she leaves.", answer: true },
    ]),
    qaItem("Please and sorry are important words. If you want something, say please. If you make a mistake, say sorry. These words make people feel good.", [
      { id: 1, statement: "Please and sorry are important.", answer: true },
      { id: 2, statement: "You say please when you want something.", answer: true },
      { id: 3, statement: "You say sorry when you make a mistake.", answer: true },
    ]),
    qaItem("Welcome to our school! We are happy you are here. You will meet many friends. Everyone is kind and polite. We greet each other every morning.", [
      { id: 1, statement: "The students are happy.", answer: true },
      { id: 2, statement: "Students greet each other every morning.", answer: true },
      { id: 3, statement: "Everyone is rude.", answer: false },
    ]),
  ],
  "daily-activities": [
    qaItem("It is eight o'clock in the morning. Anna is going out with her friends. It's spring. She loves the weather. It's warm. Anna likes autumn, too. It is cool. She can go to the zoo with her parents. Anna doesn't like winter. It is cold and snowy.", [
      { id: 1, statement: "Anna is going out at nine o'clock.", answer: false },
      { id: 2, statement: "Anna doesn't like autumn.", answer: false },
      { id: 3, statement: "Anna loves spring.", answer: true },
    ]),
    qaItem("Ben rides his bike every afternoon. He puts on his helmet before riding. He goes to the park near his house. Sometimes his dog runs next to him. Ben loves riding his bike.", [
      { id: 1, statement: "Ben rides his bike every morning.", answer: false },
      { id: 2, statement: "Ben wears a helmet when riding.", answer: true },
      { id: 3, statement: "Ben's dog sometimes runs with him.", answer: true },
    ]),
    qaItem("Lucy likes cooking with her mother. They cook dinner together on Saturdays. Lucy can make pasta and soup. Her father says her soup is delicious. Lucy feels happy when people enjoy her food.", [
      { id: 1, statement: "Lucy cooks with her father.", answer: false },
      { id: 2, statement: "They cook together on Saturdays.", answer: true },
      { id: 3, statement: "Lucy's father likes her soup.", answer: true },
    ]),
    qaItem("Sam goes to bed at nine o'clock. He brushes his teeth and reads a book. His mum turns off the light. Sam sleeps for eight hours. He wakes up feeling fresh and ready for school.", [
      { id: 1, statement: "Sam goes to bed at ten o'clock.", answer: false },
      { id: 2, statement: "Sam reads a book before sleeping.", answer: true },
      { id: 3, statement: "Sam sleeps for eight hours.", answer: true },
    ]),
  ],
  animals: [
    qaItem("Dogs are great pets. They are friendly and loyal. Dogs love to play and run outside. They need food and water every day. Dogs can also learn many tricks. They are a human's best friend.", [
      { id: 1, statement: "Dogs are not friendly.", answer: false },
      { id: 2, statement: "Dogs need food and water every day.", answer: true },
      { id: 3, statement: "Dogs can learn tricks.", answer: true },
    ]),
    qaItem("Cats are quiet animals. They sleep a lot during the day. Cats like to play with toys. They clean themselves by licking their fur. Cats purr when they are happy.", [
      { id: 1, statement: "Cats are very noisy animals.", answer: false },
      { id: 2, statement: "Cats clean themselves by licking their fur.", answer: true },
      { id: 3, statement: "Cats purr when they are happy.", answer: true },
    ]),
    qaItem("Elephants are the biggest land animals. They live in Africa and Asia. Elephants use their trunks to pick up food and drink water. Baby elephants stay close to their mothers.", [
      { id: 1, statement: "Elephants are small animals.", answer: false },
      { id: 2, statement: "Elephants use their trunks to drink water.", answer: true },
      { id: 3, statement: "Baby elephants stay close to their mothers.", answer: true },
    ]),
    qaItem("Rabbits are soft and cute animals. They have long ears and short tails. Rabbits eat vegetables like carrots and lettuce. They hop around to move from place to place.", [
      { id: 1, statement: "Rabbits have short ears.", answer: false },
      { id: 2, statement: "Rabbits eat vegetables.", answer: true },
      { id: 3, statement: "Rabbits hop to move around.", answer: true },
    ]),
  ],
  food: [
    qaItem("Fruits are healthy foods. Apples are red or green. Bananas are yellow and sweet. Oranges are full of vitamin C. Eating fruit every day keeps you healthy and strong.", [
      { id: 1, statement: "Bananas are sour.", answer: false },
      { id: 2, statement: "Oranges have vitamin C.", answer: true },
      { id: 3, statement: "Fruit is healthy for you.", answer: true },
    ]),
    qaItem("Pizza is a popular food. It has a bread base with tomato sauce and cheese. You can add vegetables or meat on top. Pizza is baked in a very hot oven.", [
      { id: 1, statement: "Pizza has a rice base.", answer: false },
      { id: 2, statement: "Pizza is baked in a hot oven.", answer: true },
      { id: 3, statement: "You can add vegetables on pizza.", answer: true },
    ]),
    qaItem("Milk is a healthy drink. It comes from cows. Milk has calcium that makes your bones strong. Children should drink milk every day. You can also eat cheese and yogurt made from milk.", [
      { id: 1, statement: "Milk comes from chickens.", answer: false },
      { id: 2, statement: "Milk has calcium for strong bones.", answer: true },
      { id: 3, statement: "Cheese is made from milk.", answer: true },
    ]),
    qaItem("Bread is made from flour and water. Bakers bake bread in an oven. There are many kinds of bread: white bread, brown bread, and wholegrain bread. Bread gives you energy for the day.", [
      { id: 1, statement: "Bread is made from rice.", answer: false },
      { id: 2, statement: "Bread gives you energy.", answer: true },
      { id: 3, statement: "There are different kinds of bread.", answer: true },
    ]),
  ],
  sports: [
    qaItem("Football is the most popular sport in the world. Players kick a ball into the other team's goal. Each team has eleven players. A match lasts ninety minutes. The team with the most goals wins.", [
      { id: 1, statement: "Each team has ten players.", answer: false },
      { id: 2, statement: "Players kick a ball in football.", answer: true },
      { id: 3, statement: "A football match lasts ninety minutes.", answer: true },
    ]),
    qaItem("Basketball is played on a court. Players throw a ball through a hoop. Each team has five players. The game has four quarters. You score two points for most baskets.", [
      { id: 1, statement: "Each basketball team has six players.", answer: false },
      { id: 2, statement: "Players throw the ball through a hoop.", answer: true },
      { id: 3, statement: "The game has four quarters.", answer: true },
    ]),
    qaItem("Swimming is great exercise. You use your whole body when you swim. There are different styles: freestyle, backstroke, and butterfly. Swimming keeps your heart healthy.", [
      { id: 1, statement: "Swimming only uses your arms.", answer: false },
      { id: 2, statement: "Backstroke is a style of swimming.", answer: true },
      { id: 3, statement: "Swimming keeps your heart healthy.", answer: true },
    ]),
    qaItem("Tennis is played with a racket and a ball. Two or four players can play. The court is divided by a net. Players hit the ball over the net. You win a point when the other player misses the ball.", [
      { id: 1, statement: "Tennis uses a bat and a ball.", answer: false },
      { id: 2, statement: "The court is divided by a net.", answer: true },
      { id: 3, statement: "You win a point when the other player misses.", answer: true },
    ]),
  ],
};

const storySeeds = {
  greetings: [
    ["Good Morning", "morning", "Tom wakes up early every day. He says 'Good morning!' to his mom and dad. His mom gives him a big hug. His dad makes breakfast for the family. Tom feels happy and ready for school.", "Tom thuc day som moi ngay. Cau chao buoi sang bo me. Me om cau, bo lam bua sang. Tom thay vui va san sang den truong."],
    ["Hello, New Friend", "friend", "Lucy moves to a new school. She feels nervous on the first day. A girl named Mia smiles and says hello. Lucy smiles back. They become best friends.", "Lucy chuyen den truong moi. Ngay dau co be hoi lo. Mia mim cuoi chao Lucy. Hai ban tro thanh ban than."],
    ["See You Tomorrow", "tomorrow", "School is over for the day. Jake and his friends walk to the gate. They wave and say goodbye. Jake feels warm inside.", "Tan hoc, Jake va cac ban di ra cong. Ho vay tay tam biet va hen gap ngay mai. Jake thay am ap trong long."],
    ["Nice to Meet You", "meet", "Dan visits his aunt's house for the first time. He meets his cousin Sara. They shake hands and play together all afternoon.", "Dan den nha co lan dau. Cau gap chi ho Sara. Hai ban bat tay va choi voi nhau ca chieu."],
    ["How Are You?", "howareyou", "Every morning, Mrs. Brown greets her students. She asks how they are today. The students answer and smile.", "Moi sang, co Brown chao hoc sinh va hoi cac em co khoe khong. Hoc sinh tra loi va mim cuoi."],
  ],
  "daily-activities": [
    ["My Morning Routine", "morning2", "I wake up at six thirty every morning. I brush my teeth, wash my face, eat breakfast, and leave the house at seven thirty.", "Toi thuc day luc sau gio ruoi. Toi danh rang, rua mat, an sang va roi nha luc bay gio ruoi."],
    ["After School", "afterschool", "School finishes at half past three. I walk home with my friend Ben, have a snack, rest, and do my homework.", "Truong ket thuc luc ba gio ruoi. Toi di bo ve nha voi Ben, an nhe, nghi ngoi va lam bai tap."],
    ["Helping at Home", "home", "Every Saturday, I help my parents with chores. I sweep the floor and take out the rubbish. We work together and finish quickly.", "Moi thu Bay, toi giup bo me lam viec nha. Toi quet san va do rac. Ca nha lam cung nhau nen xong nhanh."],
    ["Evening Time", "evening", "After dinner, my family sits in the living room together. I play board games, take a shower, and read before I sleep.", "Sau bua toi, gia dinh toi ngoi phong khach. Toi choi co, tam va doc sach truoc khi ngu."],
    ["A Busy Weekend", "weekend", "On Sunday mornings my family goes to the market. In the afternoon my dad takes me to the park to play football and fly a kite.", "Sang Chu nhat, gia dinh toi di cho. Buoi chieu, bo dua toi ra cong vien da bong va tha dieu."],
  ],
  animals: [
    ["The Clever Dog", "dog", "Max is a golden dog who lives with the Brown family. He brings the newspaper every morning and plays with the children after school.", "Max la chu cho vang cua gia dinh Brown. Moi sang no mang bao va sau gio hoc choi voi tre em."],
    ["The Little Bird", "bird", "There is a little blue bird in the garden. It sings every morning and later builds a nest with three small eggs.", "Co mot chu chim xanh trong vuon. No hot moi sang va xay to voi ba qua trung nho."],
    ["Elephants Are Amazing", "elephant", "Elephants are the largest animals on land. They use their trunks to pick up food and drink water. Baby elephants stay close to their mothers.", "Voi la dong vat tren can lon nhat. Chung dung voi de lay thuc an va uong nuoc. Voi con o gan me."],
    ["My Pet Cat", "cat", "I have a pet cat named Coco. She has soft white fur and bright green eyes. Coco sleeps on my bed every night.", "Toi co meo cung ten Coco. No co long trang mem va mat xanh. Moi dem Coco ngu tren giuong toi."],
    ["Life Under the Sea", "ocean", "The ocean is home to thousands of animals. Fish, dolphins, sea turtles, and whales all live in the sea.", "Dai duong la nha cua hang nghin dong vat. Ca, ca heo, rua bien va ca voi song o bien."],
  ],
  food: [
    ["At the Market", "market", "Every Sunday, Lily goes to the market with her mother. They buy fruit, vegetables, bread, and one sweet treat.", "Moi Chu nhat, Lily di cho voi me. Ho mua trai cay, rau, banh mi va mot mon ngot."],
    ["Lunchtime", "lunch", "At school, Tom eats lunch in the canteen. Today he has rice, chicken soup, salad, orange juice, and an apple.", "O truong, Tom an trua trong cang tin. Hom nay cau an com, canh ga, salad, nuoc cam va tao."],
    ["My Favourite Food", "favourite", "My favourite food is pizza. My mother makes pizza every Friday night and the whole family enjoys it together.", "Mon an yeu thich cua toi la pizza. Me lam pizza moi toi thu Sau va ca nha cung thuong thuc."],
    ["Healthy Eating", "healthy", "Our teacher says we should eat healthy food every day. Fruit, vegetables, rice, milk, eggs, and water are important.", "Co giao noi chung toi nen an lanh manh moi ngay. Trai cay, rau, com, sua, trung va nuoc rat quan trong."],
    ["Birthday Cake", "cake", "Today is Emma's birthday. Her dad bakes a big chocolate cake with eight candles. Everyone sings and cheers.", "Hom nay la sinh nhat Emma. Bo lam banh socola lon voi tam cay nen. Moi nguoi hat va chuc mung."],
  ],
  sports: [
    ["Football After School", "football", "Every Tuesday, Jack and his friends play football in the park. Jack scores in the last minute and his team wins.", "Moi thu Ba, Jack va cac ban da bong trong cong vien. Jack ghi ban phut cuoi va doi cau thang."],
    ["Swimming Lessons", "swimming", "Amy goes to swimming lessons every Saturday. She practises hard and can swim one hundred metres without stopping.", "Amy hoc boi moi thu Bay. Co be tap cham chi va co the boi mot tram met khong dung."],
    ["The Race", "race", "It is sports day at school. Ben runs in the one hundred metre race and crosses the finish line first.", "Hom nay la ngay the thao. Ben chay cuoc dua mot tram met va ve dich dau tien."],
    ["Basketball Team", "basketball", "Sam joins the school basketball team. He learns to dribble, pass, and shoot. The coach says teamwork matters most.", "Sam tham gia doi bong ro. Cau hoc nhoi bong, chuyen bong va nem bong. Huan luyen vien noi tinh dong doi quan trong nhat."],
    ["Cycling Together", "cycling", "On Sunday, the whole family goes cycling along the river. They stop for cold drinks and ride home tired but happy.", "Chu nhat, ca nha dap xe doc bo song. Ho dung uong nuoc lanh roi dap xe ve nha, met nhung vui."],
  ],
};

function buildTopics() {
  const topics = [];

  topics.push(
    ...topicMeta.map((meta, index) => ({
      mode: "listen-fill",
      ...meta,
      description: descriptions["listen-fill"][meta.slug],
      orderIndex: index + 1,
      items: listenFill[meta.slug],
    }))
  );

  topics.push(
    ...topicMeta.map((meta, index) => {
      const data = repeatCards[meta.slug];
      return {
        mode: "listen-repeat",
        ...meta,
        description: descriptions["listen-repeat"][meta.slug],
        orderIndex: index + 1,
        items: data.cards.map(([word, audioText, image]) => ({
          title: word,
          prompt: data.prompt,
          audio_text: audioText,
          content_data: { word, audioText, image, prompt: data.prompt },
        })),
      };
    })
  );

  topics.push(
    ...topicMeta.map((meta, index) => ({
      mode: "read-answer",
      ...meta,
      description: descriptions["read-answer"][meta.slug],
      orderIndex: index + 1,
      items: readAnswer[meta.slug],
    }))
  );

  topics.push(
    ...topicMeta.map((meta, index) => ({
      mode: "read-story",
      ...meta,
      description: descriptions["read-story"][meta.slug],
      orderIndex: index + 1,
      items: storySeeds[meta.slug].map(([title, imageSeed, english, vietnamese]) =>
        storyItem(title, imageSeed, english, vietnamese)
      ),
    }))
  );

  return topics;
}

async function seedPractice() {
  const topics = buildTopics();
  let topicCount = 0;
  let itemCount = 0;

  for (const topicData of topics) {
    const [topic] = await PracticeTopic.findOrCreate({
      where: {
        mode: topicData.mode,
        slug: topicData.slug,
      },
      defaults: {
        mode: topicData.mode,
        slug: topicData.slug,
        title: topicData.title,
        description: topicData.description,
        emoji: topicData.emoji,
        color: topicData.color,
        image_url: topicData.imageUrl,
        order_index: topicData.orderIndex,
        is_active: true,
      },
    });

    await topic.update({
      title: topicData.title,
      description: topicData.description,
      emoji: topicData.emoji,
      color: topicData.color,
      image_url: topicData.imageUrl,
      order_index: topicData.orderIndex,
      is_active: true,
    });
    topicCount += 1;

    for (let index = 0; index < topicData.items.length; index++) {
      const itemData = topicData.items[index];
      const [item] = await PracticeItem.findOrCreate({
        where: {
          topic_id: topic.id,
          order_index: index + 1,
        },
        defaults: {
          topic_id: topic.id,
          order_index: index + 1,
        },
      });

      await item.update({
        title: itemData.title || null,
        prompt: itemData.prompt || null,
        passage: itemData.passage || null,
        image_url: itemData.image_url || null,
        audio_text: itemData.audio_text || null,
        translation: itemData.translation || null,
        content_data: itemData.content_data || {},
      });
      itemCount += 1;
    }

    await PracticeItem.destroy({
      where: {
        topic_id: topic.id,
        order_index: { [Op.gt]: topicData.items.length },
      },
    });
  }

  console.log(`Practice seed synchronized: ${topicCount} topics, ${itemCount} items`);
}

if (require.main === module) {
  seedPractice()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Practice seed failed:", error);
      process.exit(1);
    });
}

module.exports = seedPractice;
