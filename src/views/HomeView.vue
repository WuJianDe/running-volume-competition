<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeaderboard } from '@/composables/useLeaderboard'
import HeroSection from '@/components/HeroSection.vue'
import StatsSummary from '@/components/StatsSummary.vue'
import ScoringRule from '@/components/ScoringRule.vue'
import TeamBoard from '@/components/TeamBoard.vue'
import SyncButton from '@/components/SyncButton.vue'

const {
  loading,
  error,
  rankedTeamA,
  rankedTeamB,
  teamAScore,
  teamBScore,
  totalRunners,
  totalDistance,
  totalElevation,
  leadingTeam,
  refresh,
} = useLeaderboard()

// ── URL 參數 ──────────────────────────────────────────────────
const searchParams = new URLSearchParams(window.location.search)
const connectRunnerId = searchParams.get('connect')
const justConnected   = ref(searchParams.get('connected') === 'true')

if (justConnected.value) {
  window.history.replaceState({}, '', '/')
}

const connectRunner = computed(() =>
  connectRunnerId
    ? [...rankedTeamA.value, ...rankedTeamB.value].find(r => r.id === connectRunnerId) ?? null
    : null
)

</script>

<template>
  <div
    class="h-full w-full overflow-auto"
    style="background: #0A0A0A; color: #E5E5E5; font-family: 'Outfit', sans-serif"
  >
    <!-- Loading -->
    <div v-if="loading" class="h-full flex items-center justify-center">
      <p class="font-mono text-xs tracking-widest animate-pulse" style="color: #525252">
        LOADING...
      </p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="h-full flex items-center justify-center px-5">
      <p class="font-mono text-xs text-center" style="color: #EF4444">
        無法載入資料：{{ error }}
      </p>
    </div>

    <!-- 主內容 -->
    <template v-else>
      <HeroSection />

      <!-- 連結成功通知 -->
      <div v-if="justConnected" class="max-w-5xl mx-auto px-5 mb-4 fade-up">
        <div
          class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
          style="background: rgba(74,222,128,.06); border: 1px solid rgba(74,222,128,.2)"
        >
          <p class="text-xs font-mono" style="color: #4ADE80">
            ✓ Strava 已成功連結！點擊右下角「更新數據」按鈕同步成績
          </p>
          <button @click="justConnected = false" class="text-xs font-mono shrink-0" style="color: #525252">✕</button>
        </div>
      </div>

      <!-- 連結 Strava 區塊（參賽者點擊個人連結後看到） -->
      <section v-if="connectRunnerId" class="max-w-5xl mx-auto px-5 mb-6 fade-up">
        <div
          class="flex flex-col items-center gap-4 px-6 py-8 rounded-xl text-center"
          style="background: rgba(255,255,255,.02); border: 1px solid rgba(245,158,11,.15)"
        >
          <p class="text-2xl">🏃</p>
          <div>
            <p class="font-semibold" style="color: #F5F5F5">
              {{ connectRunner ? connectRunner.name : '跑者' }}，歡迎加入！
            </p>
            <p class="text-xs mt-1" style="color: #737373">連結你的 Strava 帳號以自動同步跑步資料</p>
          </div>
          <a
            :href="`/api/strava/auth?runner_id=${connectRunnerId}`"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style="background: #FC4C02; color: #fff"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
            </svg>
            連結 Strava
          </a>
        </div>
      </section>

      <StatsSummary
        :totalRunners="totalRunners"
        :totalDistance="totalDistance"
        :totalElevation="totalElevation"
        :leadingTeam="leadingTeam"
      />

      <ScoringRule />

      <!-- 排行榜 -->
      <section class="max-w-5xl mx-auto px-5 pb-8">
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

      <footer class="text-center pb-10 fade-up fade-up-8">
        <p class="text-xs font-mono" style="color: #333">RUNNING LEAGUE © 2025</p>
      </footer>
    </template>

    <!-- 浮動更新按鈕 -->
    <SyncButton @synced="refresh" />
  </div>
</template>
