# Skill: UI Verifier

## Purpose

驗證 implementation 是否符合 Locked UI/UX contract 與 canonical references，同時避免把 screenshot 當唯一真相。

## Read

- mapped Screen / Overlay text contract
- Design System
- canonical reference image
- responsive/state Acceptance

## Verify

1. layout / hierarchy / CTA / states
2. desktop + mobile
3. loading / empty / error / recovery
4. navigation / overlay behavior
5. text/content constraints
6. visual regression
7. accessibility basics

## Evidence

產生 screenshot / visual-diff / viewport / accessibility Evidence，並綁 Task + AC/Test。

## Rule

文字 contract 決定 behavior；reference image輔助 visual。若兩者衝突，不能自行選一個，建立 SPEC_AMBIGUITY Finding。

## Stop

Material visual decision、未定 interaction、跨 Screen behavior change → Human Gate。
