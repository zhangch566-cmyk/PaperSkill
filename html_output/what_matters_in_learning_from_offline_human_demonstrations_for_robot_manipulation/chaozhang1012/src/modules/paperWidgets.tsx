import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 290;
const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', ink:'#21324a', muted:'#68778f', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', line:'#d7deea' };

type Row = { label:string; values:number[]; note:string };
const data: Record<string, Row[]> = {
  '3.2': [
    {label:'Lift · PH · 低维', values:[100,100], note:'成功率（%），BC 与 BC-RNN；论文 Table 1'},
    {label:'Can · PH · 低维', values:[95.3,100], note:'成功率（%），BC 与 BC-RNN；论文 Table 1'},
    {label:'Square · PH · 低维', values:[78.7,84], note:'成功率（%），BC 与 BC-RNN；论文 Table 1'},
    {label:'Transport · PH · 低维', values:[17.3,71.3], note:'成功率（%），BC 与 BC-RNN；论文 Table 1'},
  ],
  '5.2': [
    {label:'Can-Worse', values:[56.7,92,29.3,4], note:'成功率（%）；Table 2，混合较差示范'},
    {label:'Can-Okay', values:[72,95.3,58,22], note:'成功率（%）；Table 2，混合一般示范'},
    {label:'Can-Better', values:[83.3,99.3,62,20.7], note:'成功率（%）；Table 2，混合较好示范'},
  ],
  '6.1': [
    {label:'Lift · PH · 低维', values:[96.7,100,100], note:'成功率（%）；Table 27，数据量 20/50/100%'},
    {label:'Can · PH · 低维', values:[76.7,97.3,100], note:'成功率（%）；Table 27，数据量 20/50/100%'},
    {label:'Square · PH · 低维', values:[38.7,67.3,84], note:'成功率（%）；Table 27，数据量 20/50/100%'},
    {label:'Transport · PH · 低维', values:[6.7,44,71.3], note:'成功率（%）；Table 27，数据量 20/50/100%'},
  ],
  '7.1': [
    {label:'Square · 低维', values:[84,42.7,39.3], note:'成功率（%）；Table 25，默认 / 加 EEF 速度 / 加关节'},
    {label:'Transport · 低维', values:[71.3,8.7,10], note:'成功率（%）；Table 25，默认 / 加 EEF 速度 / 加关节'},
    {label:'Square · 图像', values:[82,64.7,58], note:'成功率（%）；Table 25，默认 / 加 EEF 速度 / 加关节'},
    {label:'Transport · 图像', values:[72,64.7,70.7], note:'成功率（%）；Table 25，默认 / 加 EEF 速度 / 加关节'},
  ],
  '7.2': [
    {label:'Square · PH · 低维', values:[84,86,82,82,81.3], note:'成功率（%）；Table 26，默认 / 大 LR / 无 GMM / 大 MLP / 小 RNN'},
    {label:'Transport · PH · 低维', values:[71.3,64,69.3,58.7,47.3], note:'成功率（%）；Table 26，同上'},
    {label:'Square · MH · 低维', values:[78,76.7,58,73.3,58.7], note:'成功率（%）；Table 26，同上'},
    {label:'Transport · MH · 低维', values:[65.3,49.3,27.3,46,27.3], note:'成功率（%）；Table 26，同上'},
  ],
  '8.1': [
    {label:'Square · PH · 低维 · BC-RNN', values:[7.3,74,84], note:'成功率（%）；Table 29，Valid / Last / Max'},
    {label:'Transport · PH · 低维 · BC-RNN', values:[4,59.3,71.3], note:'成功率（%）；Table 29，Valid / Last / Max'},
    {label:'Square · PH · 图像 · BC-RNN', values:[35.3,64.7,82], note:'成功率（%）；Table 29，Valid / Last / Max'},
    {label:'Transport · PH · 图像 · BC-RNN', values:[0,58.7,72], note:'成功率（%）；Table 29，Valid / Last / Max'},
  ],
};

const options: Record<string,string[]> = {
  '1.1':['C1 非马尔可夫','C2 示范质量','C3 数据规模','C4 目标错配','C5 设计敏感'],
  '1.2':['验证损失','任务成功率'], '2.1':['低维状态','图像观测'], '3.1':['单帧','4 帧历史','8 帧历史'],
  '3.2':['Lift','Can','Square','Transport'], '4.1':['BC','BC-RNN','BCQ','CQL','HBC','IRIS'],
  '5.1':['较差示范 20%','较差示范 50%','较差示范 80%'], '5.2':['Can-Worse','Can-Okay','Can-Better'],
  '6.1':['Lift','Can','Square','Transport'], '7.1':['Square · 低维','Transport · 低维','Square · 图像','Transport · 图像'],
  '7.2':['Square · PH · 低维','Transport · PH · 低维','Square · MH · 低维','Transport · MH · 低维'],
  '8.1':['Square · PH · 低维','Transport · PH · 低维','Square · PH · 图像','Transport · PH · 图像'],
  '9.1':['Lift','Can','Square','Transport','Tool Hang'], '9.2':['仿真','真实机器人','图像输入'],
  '10.1':['历史依赖','示范质量','策略选择'], '10.2':['任务','数据','算法','评估','开源'],
};

function text(ctx:CanvasRenderingContext2D, value:string, x:number, y:number, size=20, color=C.ink, weight='500') { ctx.fillStyle=color; ctx.font=`${weight} ${size}px Segoe UI, PingFang SC, sans-serif`; ctx.fillText(value,x,y); }
function frame(ctx:CanvasRenderingContext2D, title:string, subtitle?:string) { ctx.clearRect(0,0,W,H); ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H); text(ctx,title,28,34,22,C.ink,'700'); if(subtitle) text(ctx,subtitle,28,62,16,C.muted); }
function bars(ctx:CanvasRenderingContext2D, row:Row, active:number, labels:string[]) {
  frame(ctx,row.label,row.note); const left=100, top=96, bottom=238, width=860; ctx.strokeStyle=C.line; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(left,top); ctx.lineTo(left,bottom); ctx.lineTo(left+width,bottom); ctx.stroke();
  [0,25,50,75,100].forEach(v=>{const y=bottom-(v/100)*(bottom-top); ctx.strokeStyle='#e6ebf0';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+width,y);ctx.stroke(); text(ctx,`${v}%`,42,y+6,14,C.muted);});
  const gap=24, bw=(width-gap*(row.values.length-1))/row.values.length;
  row.values.forEach((v,i)=>{const x=left+i*(bw+gap);const h=(clamp(v,0,100)/100)*(bottom-top);ctx.fillStyle=i===active?C.green:C.blue;ctx.fillRect(x,bottom-h,bw,h);text(ctx,`${v.toFixed(v%1?1:0)}%`,x+8,bottom-h-8,17,C.ink,'700');text(ctx,labels[i]||'',x,bottom+28,15,C.muted);});
}
function drawModule(ctx:CanvasRenderingContext2D, moduleId:string, idx:number, slider:number) {
  if(moduleId==='old'||moduleId==='new'){
    frame(ctx,moduleId==='old'?'只看当前画面':'纳入历史与任务成功率',moduleId==='old'?'误差一旦偏离，后续动作会继续累积':'用时间上下文训练，并用环境成功率选检查点');
    ctx.strokeStyle=C.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(120,215);ctx.lineTo(940,215);ctx.stroke();
    ctx.strokeStyle=moduleId==='old'?C.red:C.green;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(150,205);ctx.lineTo(320,170);ctx.lineTo(500,moduleId==='old'?115:150);ctx.lineTo(680,moduleId==='old'?78:105);ctx.lineTo(870,moduleId==='old'?55:70);ctx.stroke();
    ctx.fillStyle=moduleId==='old'?C.red:C.green;ctx.beginPath();ctx.arc(870,moduleId==='old'?55:70,14,0,Math.PI*2);ctx.fill();text(ctx,moduleId==='old'?'误差累积':'历史 + 成功率',720,252,18,moduleId==='old'?C.red:C.green,'700');return;
  }
  if(data[moduleId]) { const rows=data[moduleId]; const row=rows[idx%rows.length]; const labels=moduleId==='3.2'?['BC','BC-RNN']:moduleId==='5.2'?['BC','BC-RNN','BCQ','CQL']:moduleId==='6.1'?['20% 数据','50% 数据','100% 数据']:moduleId==='7.1'?['默认','+ EEF 速度','+ 关节']:moduleId==='7.2'?['默认','大 LR','无 GMM','大 MLP','小 RNN']:['Valid','Last','Max']; bars(ctx,row, moduleId==='3.2'?1:row.values.indexOf(Math.max(...row.values)),labels); return; }
  const opts=options[moduleId]||[];
  if(moduleId==='1.1'){frame(ctx,'五个挑战：点击一个看它影响什么','论文第 2 节 C1–C5；这里没有“权重分数”');opts.forEach((v,i)=>{const x=36+i*204;ctx.fillStyle=i===idx?C.green:'#ffffff';ctx.strokeStyle=i===idx?C.green:C.line;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,100,176,94,12);ctx.fill();ctx.stroke();text(ctx,v.split(' ')[0],x+14,134,18,i===idx?'#fff':C.blue,'700');text(ctx,v.slice(v.indexOf(' ')+1),x+14,166,16,i===idx?'#fff':C.ink);});return;}
  if(moduleId==='1.2'){frame(ctx,'两个指标不在同一条评价轴上','示意曲线：验证损失越低越好，成功率越高越好');ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(90,230);ctx.lineTo(980,230);ctx.moveTo(90,90);ctx.lineTo(90,230);ctx.stroke();ctx.strokeStyle=idx===0?C.red:C.green;ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<9;i++){const x=110+i*100;const y=idx===0?105+i*12:210-i*15; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();text(ctx,idx===0?'验证损失（越低越好）':'任务成功率（越高越好）',110,75,18,idx===0?C.red:C.green,'700');text(ctx,'训练轮次 →',850,258,15,C.muted);return;}
  if(moduleId==='2.1'){frame(ctx,'观测空间改变了输入形式','论文第 3.2 节：两种观测都包含末端位姿和夹爪位置');const left=70;ctx.fillStyle=idx===0?C.green:'#fff';ctx.strokeStyle=C.line;ctx.beginPath();ctx.roundRect(left,100,400,100,14);ctx.fill();ctx.stroke();ctx.fillStyle=idx===1?C.green:'#fff';ctx.beginPath();ctx.roundRect(610,100,400,100,14);ctx.fill();ctx.stroke();text(ctx,'低维状态',110,142,24,idx===0?'#fff':C.blue,'700');text(ctx,'位姿 + 夹爪 + 物体状态',110,174,17,idx===0?'#fff':C.ink);text(ctx,'图像观测',650,142,24,idx===1?'#fff':C.blue,'700');text(ctx,'相机帧替代物体真值',650,174,17,idx===1?'#fff':C.ink);return;}
  if(moduleId==='3.1'){frame(ctx,'历史窗口：策略一次看到几帧？','拖动滑块；窗口越长，能利用的时间上下文越多');const n=idx===0?1:idx===1?4:8;for(let i=0;i<8;i++){const x=110+i*100;ctx.fillStyle=i>=8-n?C.green:'#fff';ctx.strokeStyle=i>=8-n?C.green:C.line;ctx.beginPath();ctx.roundRect(x,130,70,58,8);ctx.fill();ctx.stroke();text(ctx,`t-${7-i}`,x+16,165,16,i>=8-n?'#fff':C.muted);}text(ctx,`当前输入：${n} 帧历史`,110,228,18,C.blue,'700');return;}
  if(moduleId==='4.1'){frame(ctx,'六种算法的“看法”不同','点击卡片，下面只解释机制，不把它们排成万能排行榜');const desc=['直接拟合动作','动作拟合 + 历史','层级行为克隆','价值约束动作','保守价值学习','历史与时间抽象'];opts.forEach((v,i)=>{const x=36+(i%3)*340,y=88+Math.floor(i/3)*82;ctx.fillStyle=i===idx?C.blue:'#fff';ctx.strokeStyle=i===idx?C.blue:C.line;ctx.beginPath();ctx.roundRect(x,y,300,62,10);ctx.fill();ctx.stroke();text(ctx,v,x+16,y+25,17,i===idx?'#fff':C.ink,'700');text(ctx,desc[i],x+16,y+48,14,i===idx?'#dbeafe':C.muted);});return;}
  if(moduleId==='5.1'){frame(ctx,'混合示范的组成','这里显示的是人为设定的示范占比，不是论文报告的成功率');const poor=[20,50,80][idx%3];ctx.fillStyle=C.red;ctx.fillRect(120,130,7.2*poor,44);ctx.fillStyle=C.orange;ctx.fillRect(120+7.2*poor,130,7.2*(100-poor)*0.5,44);ctx.fillStyle=C.green;ctx.fillRect(120+7.2*poor+3.6*(100-poor),130,3.6*(100-poor),44);text(ctx,`较差 ${poor}%`,120,208,17,C.red,'700');text(ctx,`其余 ${100-poor}%`,520,208,17,C.muted,'700');return;}
  if(moduleId==='9.1'){frame(ctx,'任务难度来自操作阶段','点击任务，查看论文描述的主要挑战');const names=['Lift','Can','Square','Transport','Tool Hang'];const notes=['抬起方块','抓取并放入小箱','精密插入','双臂转移与交接','装配并悬挂工具'];ctx.strokeStyle=C.line;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(90,175);ctx.lineTo(980,175);ctx.stroke();names.forEach((n,i)=>{const x=110+i*215;ctx.fillStyle=i===idx?C.green:C.blue;ctx.beginPath();ctx.arc(x,175,22,0,Math.PI*2);ctx.fill();text(ctx,n,x-42,125,17,i===idx?C.green:C.ink,'700');text(ctx,notes[i],x-54,220,14,C.muted);});return;}
  if(moduleId==='9.2'){frame(ctx,'部署前要重新核对什么？','每一列是一个条件，不代表自动迁移');const cols=['仿真','真实机器人','图像输入'];const rows=['传感器噪声','评估成本','策略选择'];cols.forEach((c,i)=>{text(ctx,c,250+i*250,98,18,i===idx?C.green:C.blue,'700');rows.forEach((r,j)=>{const x=180+i*250,y=135+j*38;ctx.fillStyle=i===idx?C.green:'#fff';ctx.strokeStyle=C.line;ctx.beginPath();ctx.roundRect(x,y,155,28,6);ctx.fill();ctx.stroke();text(ctx,r,x+14,y+20,14,i===idx?'#fff':C.muted);});});return;}
  if(moduleId==='10.1'){frame(ctx,'三条结论，各自有证据边界','选择一条，查看它应该带上的限定条件');const titles=['历史依赖','示范质量','策略选择'];const notes=['人类数据上时间模型更稳','混合质量会改变结果','验证损失不等于成功率'];opts.forEach((v,i)=>{const x=70+i*320;ctx.fillStyle=i===idx?C.green:'#fff';ctx.strokeStyle=i===idx?C.green:C.line;ctx.beginPath();ctx.roundRect(x,110,270,96,12);ctx.fill();ctx.stroke();text(ctx,titles[i],x+18,145,20,i===idx?'#fff':C.ink,'700');text(ctx,notes[i],x+18,176,15,i===idx?'#eafff3':C.muted);});return;}
  if(moduleId==='10.2'){frame(ctx,'复现实验需要带齐哪些字段？','每一项都要能在结果表中追溯');const names=['任务','数据','算法','评估','开源'];opts.forEach((v,i)=>{const x=80+i*190;ctx.fillStyle=i<=idx?C.green:'#fff';ctx.strokeStyle=i<=idx?C.green:C.line;ctx.beginPath();ctx.roundRect(x,130,140,54,10);ctx.fill();ctx.stroke();text(ctx,v,x+38,164,18,i<=idx?'#fff':C.muted,'700');});text(ctx,`已勾选 ${Math.min(idx+1,5)} / 5 项`,80,230,18,C.blue,'700');return;}
  frame(ctx,'选择一个状态','交互会在这里显示对应证据');
}

export const PaperWidget: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef=useRef<HTMLCanvasElement>(null); const [idx,setIdx]=useState(0); const [slider,setSlider]=useState(0);
  const opts=options[moduleId]||[]; const rowCount=data[moduleId]?.length||opts.length||1;
  useEffect(()=>{const c=canvasRef.current;if(!c)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(c,W,H)}catch{return};const render=()=>{drawModule(ctx,moduleId,idx,slider);if(!c.classList.contains('is-ready'))c.classList.add('is-ready')};render();return observeCanvas(c,render,()=>{})},[moduleId,idx,slider]);
  if(moduleId==='paper-hero') return <div><canvas ref={canvasRef} width={W} height={H}/><div className='feedback'>左侧表示“只看当前画面”，右侧表示“把历史与评估一起纳入”。</div></div>;
  const numeric=Boolean(data[moduleId]); const isSlider=moduleId==='3.1'||moduleId==='5.1';
  return <div><canvas ref={canvasRef} width={W} height={H}/>{numeric&&<div className='ctrl'><label>选择实验条件：<span className='val'>{options[moduleId]?.[idx%rowCount]}</span></label><input type='range' min='0' max={Math.max(rowCount-1,0)} value={idx%rowCount} onChange={e=>setIdx(Number(e.target.value))}/></div>}{isSlider&&<div className='ctrl'><label>选择状态：<span className='val'>{opts[idx%opts.length]}</span></label><input type='range' min='0' max={Math.max(opts.length-1,0)} value={idx%opts.length} onChange={e=>setIdx(Number(e.target.value))}/></div>}{!numeric&&!isSlider&&opts.length>0&&<div className='ctrl'><label>选择状态：<span className='val'>{opts[idx%opts.length]}</span></label><div className='chip-row'>{opts.map((o,i)=><button key={o} className={i===idx?'active':''} onClick={()=>setIdx(i)}>{o}</button>)}</div></div>}<div className={`feedback ${idx===0?'':'good'}`}>{numeric?'柱高是论文表中的成功率（%）；绿色表示当前选中的条件。':moduleId==='5.1'?'百分比只表示示范组成，不能当成成功率。':'当前选项已同步到图形；请把它与上方的限定条件一起阅读。'}</div></div>;
};

const sceneNotes: Record<string, {kicker:string; title:string; detail:string; bars:number[]}> = {
  'chap-1': {kicker:'问题地图', title:'五个挑战', detail:'C1–C5', bars:[35,58,44,72,52]},
  'chap-2': {kicker:'数据记录', title:'轨迹字段', detail:'观测 · 动作 · 结果', bars:[68,42,56]},
  'chap-3': {kicker:'时间上下文', title:'历史窗口', detail:'当前帧 ← 过去动作', bars:[30,48,70,88]},
  'chap-4': {kicker:'算法假设', title:'六种学习方式', detail:'动作拟合 ↔ 价值估计', bars:[80,52,66,38,60,46]},
  'chap-5': {kicker:'数据质量', title:'多人示范', detail:'较差 · 一般 · 较好', bars:[48,72,34]},
  'chap-6': {kicker:'数据规模', title:'覆盖范围', detail:'20% → 50% → 100%', bars:[28,56,86]},
  'chap-7': {kicker:'敏感性', title:'设计选择', detail:'观测 + 超参数', bars:[82,54,39,65]},
  'chap-8': {kicker:'策略选择', title:'检查点', detail:'Valid · Last · Max', bars:[26,62,88]},
  'chap-9': {kicker:'真实迁移', title:'任务难度', detail:'仿真 → 真实', bars:[30,46,64,78]},
  'chap-10': {kicker:'复现卡', title:'证据闭环', detail:'结论 · 协议 · 资源', bars:[74,58,86]},
};

export const PaperScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const note = sceneNotes[chapterId] || sceneNotes['chap-1'];
  return <div className="scene-mini">
    <div className="scene-mini-kicker">{note.kicker}</div>
    <div className="scene-mini-title">{note.title}</div>
    <div className="scene-mini-bars">{note.bars.map((height, index) => <span key={index} style={{height: `${height}%`}} />)}</div>
    <div className="scene-mini-detail">{note.detail}</div>
  </div>;
};
export const PaperHero = PaperWidget;
