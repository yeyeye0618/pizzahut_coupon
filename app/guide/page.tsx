import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { getCoupons, landingTags, latestUpdate } from '@/lib/coupons'
import { SITE_NAME } from '@/lib/site'

export const revalidate = 3600

const TITLE = '必勝客優惠代碼怎麼用？使用說明與常見問題'
const DESCRIPTION =
  '必勝客（Pizza Hut）優惠代碼的使用方式、外帶外送限制、最高價值與折數的意思、代碼失效的原因，以及本站資料多久更新一次。'

export const metadata: Metadata = {
  title: { absolute: `${TITLE}｜${SITE_NAME}` },
  description: DESCRIPTION,
  alternates: { canonical: '/guide' },
  openGraph: { url: '/guide', title: TITLE, description: DESCRIPTION },
}

const STEPS = [
  {
    title: '找到想要的優惠',
    body: '在首頁輸入關鍵字（例如「腿排」「可樂」或代碼本身），或點選「尺寸」「內容」篩選。尺寸選多個代表哪一種都可以；內容選多個代表同一張券都吃得到，像「雞軟骨或可樂（2選1）」這種只能挑一樣的，不會被當成兩樣都有。',
  },
  {
    title: '看清楚內容與價格',
    body: '每張卡片列出套餐品項、優惠價和最高價值。標示「2選1」「3選1」的品項是二選一或三選一，完整的使用條件在「完整說明」裡。',
  },
  {
    title: '跳轉訂餐',
    body: '按「跳轉訂餐」會開啟必勝客官網的訂餐頁，並自動帶入這組代碼。選好口味加入購物車後照官網流程結帳即可。',
  },
  {
    title: '收藏常用的代碼',
    body: '按代碼旁的星號加入最愛，之後在搜尋欄點「最愛」就只會顯示收藏的優惠。',
  },
]

const FAQ = [
  {
    q: '必勝客優惠代碼怎麼使用？',
    a: '在本站找到優惠後按「跳轉訂餐」，會直接開啟必勝客官網的訂餐頁並帶入代碼。也可以在官網訂餐時自行輸入卡片上的五位數代碼。',
  },
  {
    q: '外帶和外送都可以用嗎？',
    a: '依每張優惠的說明而定。多數標示「外帶/外送」都可使用，部分限外帶或限外送，請以「完整說明」和官網顯示為準。外送為限區服務，官網說明實付滿 $399 免外送服務費，未滿則酌收費用。',
  },
  {
    q: '「最高價值」和「折數」是什麼意思？',
    a: '最高價值取自優惠說明中的「最高價值」或「原價」，是組合內選最貴品項時的原價總和。折數是優惠價除以最高價值，代表最划算的情況；實際省下多少取決於你選的口味。',
  },
  {
    q: '可以和其他優惠一起使用嗎？',
    a: '不行。必勝客的優惠說明都註明各項優惠恕不得併用，一筆訂單只能套用一組優惠代碼。',
  },
  {
    q: '升級餅皮或口味要另外加價嗎？',
    a: '多數套餐註明比薩餅皮升級需依門市加價規範加價，部分套餐限定特定價位以下的口味。實際金額以官網結帳畫面為準。',
  },
  {
    q: '為什麼代碼顯示無法使用？',
    a: '常見原因是優惠剛下架、限定時段或門市、限定外帶或外送，或是與其他優惠併用。本站會定期回官網重新確認，已下架的代碼會自動移除。',
  },
  {
    q: '資料多久更新一次？',
    a: '系統會定期自動到必勝客官網逐一確認每組代碼，下架的會移除、新的會加入。頁面上的「資料更新」日期就是最近一次資料變動的時間。',
  },
  {
    q: '收藏的最愛會保存在哪裡？',
    a: '存在你目前使用的瀏覽器裡，關掉再開還在，但不會同步到其他裝置；清除瀏覽資料也會一併清掉。',
  },
  {
    q: '這是必勝客的官方網站嗎？',
    a: '不是。本站是非官方整理，優惠內容、價格與使用規則請以必勝客官網為準。',
  },
]

export default async function GuidePage() {
  const coupons = await getCoupons()
  const updated = latestUpdate(coupons)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="hero">
        <div className="hero-top">
          <nav className="breadcrumb" aria-label="麵包屑">
            <Link href="/">{SITE_NAME}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">使用說明</span>
          </nav>
          <ThemeSwitcher />
        </div>
        <h1>{TITLE}</h1>
        <p className="subtitle">
          本站整理必勝客官網目前可用的 {coupons.length} 組優惠代碼。下面說明怎麼找、怎麼看、怎麼用，以及大家最常問的問題。
        </p>
      </section>

      <section className="guide-section" aria-labelledby="steps-title">
        <h2 id="steps-title">四個步驟用優惠代碼訂餐</h2>
        <ol className="guide-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="guide-section" aria-labelledby="faq-title">
        <h2 id="faq-title">常見問題</h2>
        <div className="faq-list">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className="guide-cta">
          <Link href="/">開始找優惠 →</Link>
        </p>
      </section>

      <SiteFooter tags={landingTags(coupons)} updated={updated} />
    </main>
  )
}
