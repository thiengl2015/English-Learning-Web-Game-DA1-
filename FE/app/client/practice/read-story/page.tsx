"use client"

import { PracticeTopicList } from "@/components/practice-topic-list"

export default function ReadStoryPage() {
  return (
    <PracticeTopicList
      mode="read-story"
      title="Reading Story"
      subtitle="Enjoy reading story for practice"
      hrefBase="/client/practice/read-story"
    />
  )
}
