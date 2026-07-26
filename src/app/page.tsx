"use client";

import { useEffect, useRef, useState } from "react";
import { VitalsHero } from "@/components/dashboard/vitals-hero";
import { OrchestrationShowcase } from "@/components/three/orchestration/orchestration-showcase";
import { RobotAgent } from "@/components/dashboard/robot-agent";
import { OperatorRobot } from "@/components/dashboard/operator-robot";
import { DoNotPress } from "@/components/dashboard/do-not-press";
import { SectionLabel } from "@/components/aurora/section-label";
import { useInView } from "@/hooks/use-in-view";

/*
  Intro step machine — INFINITE LOOP, scroll-triggered, PAUSED while any robot is hovered:

    0  robot-1 (health)      3.5 s
    1  robot-2 (log)         3.5 s
    2  robot-3 (backup)      3.5 s
    3  operator left only    3.0 s
    4  operator both         4.0 s
    → restart (≈ 17.5 s total cycle)

  Auto intro clouds are suppressed the moment anyHovered=true.
*/

export default function DashboardPage() {
  const [introStep, setIntroStep] = useState(-1);
  const [anyHovered, setAnyHovered] = useState(false);
  const { ref: agentsSectionRef, inView: agentsInView } = useInView<HTMLDivElement>(0.2);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Debounced hover tracking so moving between robots doesn't flicker the intro off */
  function onZoneEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    setAnyHovered(true);
  }
  function onZoneLeave() {
    leaveTimer.current = setTimeout(() => { setAnyHovered(false); leaveTimer.current = null; }, 150);
  }

  /* Infinite intro loop — starts on first scroll into view */
  useEffect(() => {
    if (!agentsInView) return;

    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function startCycle() {
      timers.forEach(clearTimeout);
      timers.length = 0;
      if (!active) return;

      timers.push(setTimeout(() => { if (active) setIntroStep(0); },     0));
      timers.push(setTimeout(() => { if (active) setIntroStep(1); },  3500));
      timers.push(setTimeout(() => { if (active) setIntroStep(2); },  7000));
      timers.push(setTimeout(() => { if (active) setIntroStep(3); }, 11000));
      timers.push(setTimeout(() => { if (active) setIntroStep(4); }, 14000));
      timers.push(setTimeout(() => { if (active) startCycle();    }, 17500));
    }

    startCycle();
    return () => { active = false; timers.forEach(clearTimeout); };
  }, [agentsInView]);

  /* When any robot is hovered, suppress intro clouds — loop timer keeps running
     but introActive props are all false, so no intro cloud appears. */
  const step = anyHovered ? -1 : introStep;

  return (
    <div className="space-y-2">

      <VitalsHero />

      <SectionLabel>Live orchestration</SectionLabel>
      <OrchestrationShowcase />

      {/* All robots wrapped in ONE hover zone — cursor on any robot hides ALL intros */}
      <div
        ref={agentsSectionRef}
        onMouseEnter={onZoneEnter}
        onMouseLeave={onZoneLeave}
      >
        <SectionLabel className="mt-10">Specialist agents</SectionLabel>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <RobotAgent agentKey="health" introActive={step === 0} />
          <RobotAgent agentKey="log"    introActive={step === 1} />
          <RobotAgent agentKey="backup" introActive={step === 2} />
        </div>

        {/* OperatorRobot inside the same hover zone */}
        <OperatorRobot
          leftActive={step === 3 || step === 4}
          rightActive={step === 4}
        />
      </div>

      <div className="mt-20 border-t border-border/20">
        <DoNotPress />
      </div>

    </div>
  );
}
