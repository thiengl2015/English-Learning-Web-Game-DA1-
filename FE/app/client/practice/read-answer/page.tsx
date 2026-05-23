"use client"

import { PracticeTopicList } from "@/components/practice-topic-list"

export default function ReadAnswerPage() {
  return (
    <PracticeTopicList
      mode="read-answer"
      title="Practice Reading"
      subtitle="Read and Choose the correct answer"
      hrefBase="/client/practice/read-answer"
    />
  )
}
