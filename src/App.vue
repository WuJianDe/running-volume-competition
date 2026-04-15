<script setup lang="ts">
import { useLeaderboard } from '@/composables/useLeaderboard'
import HeroSection from '@/components/HeroSection.vue'
import StatsSummary from '@/components/StatsSummary.vue'
import ScoringRule from '@/components/ScoringRule.vue'
import TeamBoard from '@/components/TeamBoard.vue'

const {
  rankedTeamA,
  rankedTeamB,
  teamAScore,
  teamBScore,
  totalRunners,
  totalDistance,
  totalElevation,
  leadingTeam,
} = useLeaderboard()
</script>

<template>
  <div
    class="h-full w-full overflow-auto"
    style="background: #0A0A0A; color: #E5E5E5; font-family: 'Outfit', sans-serif"
  >
    <!-- Hero -->
    <HeroSection />

    <!-- 統計摘要 -->
    <StatsSummary
      :totalRunners="totalRunners"
      :totalDistance="totalDistance"
      :totalElevation="totalElevation"
      :leadingTeam="leadingTeam"
    />

    <!-- 計分規則 -->
    <ScoringRule />

    <!-- 排行榜 -->
    <section class="max-w-5xl mx-auto px-5 pb-16">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamBoard
          :runners="rankedTeamA"
          teamName="紅隊"
          teamColor="#EC4899"
          :teamScore="teamAScore"
          :fadeDelay="5"
        />
        <TeamBoard
          :runners="rankedTeamB"
          teamName="藍隊"
          teamColor="#3B82F6"
          :teamScore="teamBScore"
          :fadeDelay="6"
        />
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center pb-10 fade-up fade-up-8">
      <p class="text-xs font-mono" style="color: #333">RUNNING LEAGUE © 2025</p>
    </footer>
  </div>
</template>
