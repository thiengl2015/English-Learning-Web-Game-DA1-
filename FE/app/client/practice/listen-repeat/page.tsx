"use client"

import { PracticeTopicList } from "@/components/practice-topic-list"

export default function ListenRepeatPage() {
  return (
    <PracticeTopicList
      mode="listen-repeat"
      title="Practice Speaking"
      subtitle="Listen and repeat the words"
      hrefBase="/client/practice/listen-repeat"
    />
  )
}
