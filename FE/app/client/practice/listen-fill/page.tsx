"use client"

import { PracticeTopicList } from "@/components/practice-topic-list"

export default function ListenFillPage() {
  return (
    <PracticeTopicList
      mode="listen-fill"
      title="Practice Listening"
      subtitle="Listen and fill in the blank"
      hrefBase="/client/practice/listen-fill"
    />
  )
}
