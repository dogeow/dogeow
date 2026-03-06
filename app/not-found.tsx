'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import styles from './not-found.module.css'

const STAR_COUNT = 150

/** 基于索引的确定性“随机”，满足 React 纯函数要求，通过 ESLint react-hooks/purity */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

/** 404 资源目录：默认 public/404/；若设置 NEXT_PUBLIC_ASSET_BASE_URL 则使用 ${base}/404 */
const ASSETS_BASE =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ASSET_BASE_URL
    ? `${process.env.NEXT_PUBLIC_ASSET_BASE_URL.replace(/\/$/, '')}/404`
    : '/404'

export default function NotFound() {
  const starStyles = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => {
      const r1 = pseudoRandom(i)
      const r2 = pseudoRandom(i + STAR_COUNT)
      const r3 = pseudoRandom(i + STAR_COUNT * 2)
      return {
        key: i,
        top: `${Math.floor(r1 * 100)}%`,
        left: `${Math.floor(r2 * 100)}%`,
        animationDelay: `${r3 * 2}s`,
      }
    })
  }, [])

  return (
    <div className={styles.container}>
      <div
        className={styles.stars}
        style={{
          backgroundImage: `url(${ASSETS_BASE}/overlay_stars.svg)`,
        }}
      >
        <div className={styles.centralBody}>
          <img
            className={styles.image404}
            src={`${ASSETS_BASE}/404.svg`}
            width={300}
            height={120}
            alt="404"
          />
          <Link
            href="/"
            className="block w-32 mx-auto my-4 py-3 text-center text-white text-base tracking-widest rounded-full border border-[whitesmoke] bg-[#00426b] transition-all duration-300 ease-in hover:bg-[#0264a0] hover:scale-105 hover:shadow-lg relative z-[100]"
          >
            返回主页
          </Link>
        </div>
        <div className="[&_img]:z-[90] [&_img]:pointer-events-none">
          <img
            className={styles.objectRocket}
            src={`${ASSETS_BASE}/rocket.svg`}
            width={40}
            height={40}
            alt=""
            aria-hidden
          />
          <img
            className={styles.objectMoon}
            src={`${ASSETS_BASE}/moon.svg`}
            width={80}
            height={80}
            alt=""
            aria-hidden
          />
          <div className={styles.boxAstronaut}>
            <img
              className={styles.objectAstronaut}
              src={`${ASSETS_BASE}/astronaut.svg`}
              width={140}
              height={140}
              alt=""
              aria-hidden
            />
          </div>
          <img
            className={styles.objectEarth}
            src={`${ASSETS_BASE}/earth.png`}
            width={100}
            height={100}
            alt=""
            aria-hidden
          />
        </div>
        <div className={styles.glowingStars} aria-hidden>
          {starStyles.map(({ key, top, left, animationDelay }) => (
            <div key={key} className={styles.star} style={{ top, left, animationDelay }} />
          ))}
        </div>
      </div>
    </div>
  )
}
