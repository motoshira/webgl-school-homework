# 003/004 - オフスクリーンレンダリング・旅客機ライクな動き

飛行物体 (cone)
- [x] 飛行物体を追加する 0.5pt
- [x] 飛行物体を毎フレーム動かす 0.5pt
- [x] 時間ベースで座標計算する (earthの中心からの距離が一定になるようにする)
- [x] 飛行物体が常に同じ位置に見えるようにcameraを追従させる 0.5pt
- [x] 飛行物体が常に進行方向を向くようにする 1pt
  <!-- - [x] pp/p/np からpd/directionを計算する -->
  <!-- - [x] これを元にquertanionを計算 -->

ミニマップ表示
<!-- - [ ] 共通のオブジェクト達を World クラスに移動 -->
- [x] 画面右下にミニマップ表示を追加 (別のRendererを用意 MiniMapRenderer) 1pt
  - Light
  - Camera
  - Objs
- [x] 飛行物体を中心に真上から満た様子をrenderする 0.5pt

MiniMapRenderer
- [x] 右下に表示させる
- [ ] 枠をつける 1pt

WorldRenderer
- [x] 既存のThreeAppの代わりに表示


ThreeApp
- [x] 2つのplaneを配置
- [x] WorldRendererをレンダーする
- [ ] リサイズ対応
