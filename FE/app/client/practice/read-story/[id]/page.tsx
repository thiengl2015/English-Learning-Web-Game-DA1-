"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ── Data ──────────────────────────────────────────────────────────────────────

interface Story {
  id: string
  title: string
  english: string
  vietnamese: string
  image: string
}

interface Topic {
  id: string
  title: string
  stories: Story[]
}

const TOPIC_DATA: Record<string, Topic> = {
  greetings: {
    id: "greetings",
    title: "Greetings",
    stories: [
      {
        id: "s1",
        title: "Good Morning",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=morning",
        english:
          "Tom wakes up early every day. He says 'Good morning!' to his mom and dad. His mom gives him a big hug. His dad makes breakfast for the family. Tom feels happy and ready for school.",
        vietnamese:
          "Tom thức dậy sớm mỗi ngày. Cậu nói 'Chào buổi sáng!' với bố và mẹ. Mẹ cậu ôm cậu thật chặt. Bố cậu làm bữa sáng cho cả gia đình. Tom cảm thấy vui vẻ và sẵn sàng đến trường.",
      },
      {
        id: "s2",
        title: "Hello, New Friend",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=friend",
        english:
          "Lucy moves to a new school. She feels nervous on the first day. A girl named Mia smiles and says 'Hello! My name is Mia.' Lucy smiles back and says 'Hi! I'm Lucy.' They become best friends.",
        vietnamese:
          "Lucy chuyển đến một trường mới. Cô bé cảm thấy lo lắng vào ngày đầu tiên. Một cô bé tên Mia mỉm cười và nói 'Xin chào! Tôi tên là Mia.' Lucy mỉm cười lại và nói 'Chào! Tôi là Lucy.' Họ trở thành những người bạn thân.",
      },
      {
        id: "s3",
        title: "See You Tomorrow",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=tomorrow",
        english:
          "School is over for the day. Jake and his friends walk to the gate. They wave and say 'Goodbye! See you tomorrow!' Jake's teacher says 'Have a great evening!' Jake feels warm inside.",
        vietnamese:
          "Trường học kết thúc cho ngày hôm đó. Jake và các bạn đi bộ ra cổng. Họ vẫy tay và nói 'Tạm biệt! Hẹn gặp lại ngày mai!' Giáo viên của Jake nói 'Chúc buổi tối vui vẻ!' Jake cảm thấy ấm lòng.",
      },
      {
        id: "s4",
        title: "Nice to Meet You",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=meet",
        english:
          "Dan visits his aunt's house for the first time. He meets his cousin Sara. Dan says 'Nice to meet you, Sara!' Sara shakes his hand and says 'Nice to meet you too, Dan!' They play together all afternoon.",
        vietnamese:
          "Dan đến thăm nhà cô của mình lần đầu tiên. Cậu gặp chị họ Sara. Dan nói 'Rất vui được gặp bạn, Sara!' Sara bắt tay cậu và nói 'Tôi cũng rất vui được gặp bạn, Dan!' Họ chơi cùng nhau suốt buổi chiều.",
      },
      {
        id: "s5",
        title: "How Are You?",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=howareyou",
        english:
          "Every morning, Mrs. Brown greets her students. She asks 'How are you today?' Some students say 'I'm fine, thank you!' Others say 'I'm great!' or 'I'm a little tired.' Mrs. Brown smiles at everyone.",
        vietnamese:
          "Mỗi buổi sáng, cô Brown chào học sinh của mình. Cô hỏi 'Hôm nay bạn có khỏe không?' Một số học sinh nói 'Tôi khỏe, cảm ơn!' Những người khác nói 'Tôi rất tuyệt!' hoặc 'Tôi hơi mệt.' Cô Brown mỉm cười với tất cả mọi người.",
      },
    ],
  },
  "daily-activities": {
    id: "daily-activities",
    title: "Daily Activities",
    stories: [
      {
        id: "s1",
        title: "My Morning Routine",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=morning2",
        english:
          "I wake up at six thirty every morning. First, I brush my teeth and wash my face. Then I eat breakfast with my family. After that, I put on my school uniform and pack my bag. I leave the house at seven thirty.",
        vietnamese:
          "Tôi thức dậy lúc sáu rưỡi mỗi sáng. Đầu tiên, tôi đánh răng và rửa mặt. Sau đó tôi ăn sáng cùng gia đình. Tiếp theo, tôi mặc đồng phục đến trường và đóng gói cặp sách. Tôi rời nhà lúc bảy rưỡi.",
      },
      {
        id: "s2",
        title: "After School",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=afterschool",
        english:
          "School finishes at half past three. I walk home with my friend Ben. When I get home, I have a snack and rest for a while. Then I do my homework at the desk in my room. I finish by five o'clock.",
        vietnamese:
          "Trường học kết thúc lúc ba rưỡi. Tôi đi bộ về nhà cùng bạn Ben. Khi về đến nhà, tôi ăn nhẹ và nghỉ ngơi một lúc. Sau đó tôi làm bài tập ở bàn trong phòng của mình. Tôi hoàn thành vào lúc năm giờ.",
      },
      {
        id: "s3",
        title: "Helping at Home",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=home",
        english:
          "Every Saturday, I help my parents with chores. I sweep the floor and take out the rubbish. My sister washes the dishes and cleans the windows. My dad mows the lawn. We work together and finish quickly.",
        vietnamese:
          "Mỗi thứ Bảy, tôi giúp bố mẹ làm việc nhà. Tôi quét sàn và đổ rác. Chị gái tôi rửa bát và lau cửa sổ. Bố tôi cắt cỏ. Chúng tôi làm việc cùng nhau và hoàn thành nhanh chóng.",
      },
      {
        id: "s4",
        title: "Evening Time",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=evening",
        english:
          "After dinner, my family sits in the living room together. My parents read books or watch the news. I play board games with my brother. At nine o'clock, I take a shower and get ready for bed. I read for twenty minutes before I sleep.",
        vietnamese:
          "Sau bữa tối, gia đình tôi ngồi cùng nhau trong phòng khách. Bố mẹ tôi đọc sách hoặc xem tin tức. Tôi chơi trò chơi cờ bàn với anh trai. Lúc chín giờ, tôi tắm và chuẩn bị đi ngủ. Tôi đọc sách hai mươi phút trước khi ngủ.",
      },
      {
        id: "s5",
        title: "A Busy Weekend",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=weekend",
        english:
          "On Sunday mornings my family goes to the market together. We buy fresh vegetables, fruit, and meat. In the afternoon my dad takes me to the park. We play football and fly a kite. It is a happy and busy day.",
        vietnamese:
          "Vào buổi sáng Chủ nhật, gia đình tôi cùng nhau đi chợ. Chúng tôi mua rau củ, trái cây và thịt tươi. Vào buổi chiều, bố đưa tôi đến công viên. Chúng tôi chơi bóng đá và thả diều. Đó là một ngày vui vẻ và bận rộn.",
      },
    ],
  },
  animals: {
    id: "animals",
    title: "Animals",
    stories: [
      {
        id: "s1",
        title: "The Clever Dog",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=dog",
        english:
          "Max is a golden dog who lives with the Brown family. He is very clever and friendly. Every morning he brings the newspaper to Mr. Brown. He also plays with the children after school. Everyone in the neighbourhood loves Max.",
        vietnamese:
          "Max là một chú chó vàng sống với gia đình Brown. Cậu ấy rất thông minh và thân thiện. Mỗi buổi sáng cậu ấy mang báo đến cho ông Brown. Cậu ấy cũng chơi với lũ trẻ sau giờ học. Tất cả mọi người trong khu phố đều yêu quý Max.",
      },
      {
        id: "s2",
        title: "The Little Bird",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=bird",
        english:
          "There is a little blue bird in the garden. It sings every morning from the tallest branch. The children love to listen to its beautiful song. One day the bird builds a nest and lays three small eggs. The whole family watches the eggs hatch.",
        vietnamese:
          "Có một chú chim xanh nhỏ trong khu vườn. Nó hót mỗi buổi sáng từ cành cây cao nhất. Lũ trẻ thích nghe tiếng hót đẹp của nó. Một ngày nọ, chim xây tổ và đẻ ba quả trứng nhỏ. Cả gia đình theo dõi những quả trứng nở.",
      },
      {
        id: "s3",
        title: "Elephants Are Amazing",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=elephant",
        english:
          "Elephants are the largest animals on land. They live in Africa and Asia. Elephants use their long trunk to pick up food and drink water. They live in family groups called herds. Baby elephants stay close to their mothers for many years.",
        vietnamese:
          "Voi là loài động vật lớn nhất trên đất liền. Chúng sống ở châu Phi và châu Á. Voi dùng cái vòi dài để nhặt thức ăn và uống nước. Chúng sống theo nhóm gia đình gọi là bầy. Voi con ở gần mẹ trong nhiều năm.",
      },
      {
        id: "s4",
        title: "My Pet Cat",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=cat",
        english:
          "I have a pet cat named Coco. She has soft white fur and bright green eyes. Coco sleeps on my bed every night. She loves to chase toys and drink warm milk. I feed her every morning and evening. Coco is my best friend.",
        vietnamese:
          "Tôi có một con mèo cưng tên Coco. Nó có bộ lông trắng mềm mại và đôi mắt xanh lá tươi sáng. Coco ngủ trên giường của tôi mỗi đêm. Nó thích đuổi theo đồ chơi và uống sữa ấm. Tôi cho nó ăn mỗi sáng và tối. Coco là người bạn thân nhất của tôi.",
      },
      {
        id: "s5",
        title: "Life Under the Sea",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=ocean",
        english:
          "The ocean is home to thousands of animals. Fish swim in colourful schools near coral reefs. Dolphins leap above the waves and play together. Sea turtles travel thousands of kilometres each year. Whales are the biggest animals in the sea.",
        vietnamese:
          "Đại dương là ngôi nhà của hàng nghìn loài động vật. Cá bơi thành đàn đầy màu sắc gần các rạn san hô. Cá heo nhảy lên trên sóng và chơi cùng nhau. Rùa biển di chuyển hàng nghìn kilômét mỗi năm. Cá voi là loài động vật lớn nhất trong biển.",
      },
    ],
  },
  food: {
    id: "food",
    title: "Food & Drinks",
    stories: [
      {
        id: "s1",
        title: "At the Market",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=market",
        english:
          "Every Sunday, Lily goes to the market with her mother. They buy fresh fruit, vegetables, and bread. Lily loves the colourful stalls and the smell of freshly baked cakes. Her mother lets her choose one treat. Lily always picks a chocolate muffin.",
        vietnamese:
          "Mỗi Chủ nhật, Lily đi chợ cùng mẹ. Họ mua trái cây tươi, rau củ và bánh mì. Lily thích những gian hàng đầy màu sắc và mùi hương của bánh mới nướng. Mẹ cô ấy cho cô ấy chọn một món ăn ngon. Lily luôn chọn bánh muffin sô cô la.",
      },
      {
        id: "s2",
        title: "Lunchtime",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=lunch",
        english:
          "At school, Tom eats lunch in the canteen. Today the menu has rice, chicken soup, and fresh salad. Tom drinks a glass of orange juice. He shares his apple with his friend Anna. They both agree that the soup is delicious.",
        vietnamese:
          "Ở trường, Tom ăn trưa trong căng tin. Hôm nay thực đơn có cơm, canh gà và salad tươi. Tom uống một ly nước cam. Cậu chia sẻ quả táo với bạn Anna. Cả hai đều đồng ý rằng canh rất ngon.",
      },
      {
        id: "s3",
        title: "My Favourite Food",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=favourite",
        english:
          "My favourite food is pizza. I love the crispy base and the melted cheese on top. My mother makes pizza every Friday night. We put tomato sauce, mushrooms, and bell peppers on it. The whole family sits together and enjoys it.",
        vietnamese:
          "Món ăn yêu thích của tôi là pizza. Tôi thích phần đế giòn và lớp phô mai tan chảy bên trên. Mẹ tôi làm pizza mỗi tối thứ Sáu. Chúng tôi cho thêm sốt cà chua, nấm và ớt chuông lên đó. Cả gia đình ngồi cùng nhau và thưởng thức.",
      },
      {
        id: "s4",
        title: "Healthy Eating",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=healthy",
        english:
          "Our teacher says we should eat healthy food every day. We need fruit and vegetables for vitamins. We need rice, bread, or pasta for energy. We need milk and eggs for strong bones. Drinking plenty of water is also very important.",
        vietnamese:
          "Giáo viên của chúng tôi nói rằng chúng tôi nên ăn thức ăn lành mạnh mỗi ngày. Chúng tôi cần trái cây và rau củ để có vitamin. Chúng tôi cần cơm, bánh mì hoặc mì ống để có năng lượng. Chúng tôi cần sữa và trứng để có xương chắc khỏe. Uống nhiều nước cũng rất quan trọng.",
      },
      {
        id: "s5",
        title: "Birthday Cake",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=cake",
        english:
          "Today is Emma's birthday. Her dad bakes a big chocolate cake with eight candles on top. The family sings happy birthday and Emma blows out all the candles in one breath. Everyone claps and cheers. The cake tastes sweet and wonderful.",
        vietnamese:
          "Hôm nay là sinh nhật của Emma. Bố cô ấy nướng một chiếc bánh sô cô la lớn với tám ngọn nến trên đó. Cả gia đình hát chúc mừng sinh nhật và Emma thổi tắt tất cả nến trong một hơi. Mọi người vỗ tay và hoan hô. Bánh có vị ngọt và tuyệt vời.",
      },
    ],
  },
  sports: {
    id: "sports",
    title: "Sports",
    stories: [
      {
        id: "s1",
        title: "Football After School",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=football",
        english:
          "Every Tuesday, Jack and his friends play football in the park. They split into two teams of five players. The game is fast and exciting. Jack scores a goal in the last minute. His team wins two to one and everyone is very happy.",
        vietnamese:
          "Mỗi thứ Ba, Jack và các bạn chơi bóng đá trong công viên. Họ chia thành hai đội mỗi đội năm người. Trận đấu nhanh và hấp dẫn. Jack ghi bàn trong phút cuối. Đội của cậu ấy thắng hai tới một và mọi người đều rất vui.",
      },
      {
        id: "s2",
        title: "Swimming Lessons",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=swimming",
        english:
          "Amy goes to swimming lessons every Saturday morning. Her coach teaches her the freestyle stroke. At first, Amy is afraid of the deep water. But she practises hard every week. After two months she can swim one hundred metres without stopping.",
        vietnamese:
          "Amy đi học bơi mỗi sáng thứ Bảy. Huấn luyện viên của cô ấy dạy cô ấy kiểu bơi tự do. Lúc đầu, Amy sợ nước sâu. Nhưng cô ấy luyện tập chăm chỉ mỗi tuần. Sau hai tháng, cô ấy có thể bơi một trăm mét mà không dừng lại.",
      },
      {
        id: "s3",
        title: "The Race",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=race",
        english:
          "It is sports day at school. Ben runs in the one hundred metre race. He trains every morning before school. At the starting line, he takes a deep breath. The whistle blows and he runs as fast as he can. He crosses the finish line first.",
        vietnamese:
          "Đó là ngày thể thao tại trường. Ben chạy trong cuộc đua một trăm mét. Cậu luyện tập mỗi sáng trước giờ học. Tại vạch xuất phát, cậu hít một hơi thật sâu. Còi vang lên và cậu chạy nhanh nhất có thể. Cậu về đích đầu tiên.",
      },
      {
        id: "s4",
        title: "Basketball Team",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=basketball",
        english:
          "Sam joins the school basketball team this year. The team practises three times a week in the gym. Sam learns how to dribble, pass, and shoot the ball. The coach says teamwork is the most important thing. Sam loves playing and making new friends on the team.",
        vietnamese:
          "Sam gia nhập đội bóng rổ của trường năm nay. Đội luyện tập ba lần một tuần trong phòng tập. Sam học cách dribble, chuyền và ném bóng. Huấn luyện viên nói tinh thần đồng đội là điều quan trọng nhất. Sam thích chơi và kết bạn mới trong đội.",
      },
      {
        id: "s5",
        title: "Cycling Together",
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=cycling",
        english:
          "On Sunday, the whole family goes cycling along the river. Dad leads the way, followed by Mum and the two children. They stop at a small café for cold drinks. Then they cycle back home feeling tired but happy. They plan to do it every week.",
        vietnamese:
          "Vào Chủ nhật, cả gia đình đi xe đạp dọc theo sông. Bố dẫn đầu, theo sau là mẹ và hai đứa trẻ. Họ dừng lại ở một quán cà phê nhỏ để uống đồ lạnh. Sau đó họ đạp xe trở về nhà cảm thấy mệt nhưng vui. Họ dự định làm điều đó mỗi tuần.",
      },
    ],
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReadStoryDetailPage() {
  const params = useParams()
  const id = params.id as string
  const topic = TOPIC_DATA[id] ?? TOPIC_DATA["greetings"]

  const topicKeys = Object.keys(TOPIC_DATA)
  const currentTopicIdx = topicKeys.indexOf(id)
  const nextTopic =
    currentTopicIdx !== -1 && currentTopicIdx < topicKeys.length - 1
      ? topicKeys[currentTopicIdx + 1]
      : topicKeys[0]

  const totalStories = topic.stories.length

  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [viewedStories, setViewedStories] = useState<Set<number>>(new Set())
  const [showModal, setShowModal] = useState(false)

  const story = topic.stories[currentIdx]

  const handlePrev = () => {
    setCurrentIdx((i) => Math.max(0, i - 1))
    setRevealed(false)
  }

  const handleNext = () => {
    const next = currentIdx + 1
    if (next >= totalStories) return
    const newViewed = new Set(viewedStories).add(currentIdx)
    setViewedStories(newViewed)
    if (newViewed.size === totalStories) {
      setTimeout(() => setShowModal(true), 300)
    }
    setCurrentIdx(next)
    setRevealed(false)
  }

  const handleReveal = () => setRevealed(true)

  const handleReset = () => {
    setCurrentIdx(0)
    setRevealed(false)
    setViewedStories(new Set())
    setShowModal(false)
  }

  // Dot colors
  const getDotClass = (i: number) => {
    if (viewedStories.has(i)) return "bg-green-400"
    if (i === currentIdx) return "bg-cyan-400"
    return "bg-white/25"
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <SpaceBackground />

      {/* Back button */}
      <Link
        href="/client/practice/read-story"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* Open-book container */}
      <div className="relative z-10 flex items-stretch justify-center gap-0 w-full max-w-5xl px-6 py-12">

        {/* ── LEFT PAGE ── */}
        <div
          className="flex-1 max-w-[420px] rounded-l-2xl flex flex-col items-center justify-between p-8 gap-6"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderRight: "none",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Topic title */}
          <h1 className="text-white font-bold text-xl text-center text-balance">{topic.title}</h1>

          {/* Illustration */}
          <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            <img
              src={story.image}
              alt={story.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Story title */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Story</p>
            <h2 className="text-white font-semibold text-lg text-balance">{story.title}</h2>
          </div>

          {/* Story number label */}
          <p className="text-white/30 text-xs text-center">Story {currentIdx + 1} of {totalStories}</p>
        </div>

        {/* ── SPINE ── */}
        <div
          className="w-4 flex-shrink-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.25), rgba(255,255,255,0.08), rgba(0,0,0,0.25))",
          }}
        />

        {/* ── RIGHT PAGE ── */}
        <div
          className="flex-1 max-w-[420px] rounded-r-2xl flex flex-col p-8 gap-5"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderLeft: "none",
            boxShadow: "8px 0 32px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Story title echo */}
          <h2 className="text-white/80 font-semibold text-base text-center">{story.title}</h2>

          {/* English passage */}
          <div className="leading-relaxed text-white/90 text-sm flex-1">
            <p>{story.english}</p>
          </div>

          {/* Vietnamese translation with card-style cover */}
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            {/* Content always rendered underneath */}
            <div className="p-4 leading-relaxed text-white/70 text-sm select-none">
              <p className="text-white/40 text-xs font-semibold mb-2 uppercase tracking-widest">Translation</p>
              <p>{story.vietnamese}</p>
            </div>

            {/* Cover overlay — fades out when revealed */}
            <div
              onClick={handleReveal}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-500
                ${revealed ? "opacity-0 pointer-events-none" : "opacity-100"}
              `}
              style={{ background: "rgba(18,12,52,0.92)" }}
            >
              {/* Blurred hint text behind */}
              <p className="absolute inset-0 p-4 pt-8 text-sm text-white/20 blur-sm leading-relaxed select-none pointer-events-none">
                {story.vietnamese}
              </p>
              {/* Center icon + label */}
              <div className="relative flex flex-col items-center gap-2 z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-white/70 text-xs font-semibold tracking-wide">Click to reveal translation</p>
              </div>
            </div>
          </div>

          {/* Bottom bar: (X/Y) · dots · prev · next */}
          <div className="flex items-center justify-between mt-1">
            {/* Prev / Next */}
            <div className="flex gap-13">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-white/8 border border-white/15 text-white/60 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {topic.stories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIdx(i); setRevealed(false) }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${getDotClass(i)}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIdx === totalStories - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 transition-all duration-200"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
