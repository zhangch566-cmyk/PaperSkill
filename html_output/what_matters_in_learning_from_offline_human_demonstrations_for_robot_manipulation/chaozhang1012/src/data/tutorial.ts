import type { TutorialData } from '../types';

const validatorShape = [
  {kind:'chapter', modules:[{kind:'module'},{kind:'module'}]}, {kind:'chapter', modules:[{kind:'module'}]},
  {kind:'chapter', modules:[{kind:'module'}]}, {kind:'chapter', modules:[{kind:'module'}]},
  {kind:'chapter', modules:[{kind:'module'}]}, {kind:'chapter', modules:[{kind:'module'}]},
  {kind:'chapter', modules:[{kind:'module'}]}, {kind:'chapter', modules:[{kind:'module'}]},
  {kind:'chapter', modules:[{kind:'module'}]},
];

const analogyCopy: Record<number, string> = {
  1: '先把五个挑战摆在桌面上：机器人为何会偏离、数据为何会混杂、训练指标为何会误导选择。',
  2: '一条示范不只是动作标签，还带着观测形式、时间顺序和可能的任务完成信号。',
  3: '把前几帧留在记忆里，策略才能判断自己是在接近目标，还是正在从轨迹上偏离。',
  4: '六种算法对同一批示范有不同的学习假设：有人拟合动作，有人还要估计动作价值。',
  5: '混合不同熟练度的操作者会改变轨迹噪声与覆盖范围，算法必须面对这种真实的数据差异。',
  6: '减少数据时，简单任务还能维持成功率；精密插入和双臂搬运则更快暴露覆盖不足。',
  7: '多一个传感器或改一个超参数都会改变输入分布，默认设置因此必须和消融结果一起阅读。',
  8: '训练轮次上的最低损失不一定带来最高成功率，最终上场的检查点要看真实任务表现。',
  9: '仿真里有效的观测和选择标准，搬到真实相机、噪声与评估成本下仍需要重新验证。',
  10: '把结论、数据协议和复现资源放在同一张卡上，才能知道论文结论适用于什么条件。',
};

const chapter = (n:number, title:string, badge:'inf'|'trn'|'both', label:string, bridge:string, scene:string, mods:{id:string,title:string,desc:string}[], insight?:string): any => ({
  kind:'chapter', id:`chap-${n}`, title, badge, badgeLabel:label, bridge,
  analogy:{title:scene, text:analogyCopy[n]},
  modules:mods.map(m=>({kind:'module',...m,componentId:'paper-module'})), insight,
  formula:n===8?{lead:'论文将每个检查点的成功率定义为 50 次 rollout 中完成任务的比例：',unicode:'SR = 成功回合 / 50 × 100%',symbols:[{sym:'SR',desc:'任务成功率，越高越好'},{sym:'50',desc:'每个检查点的评估回合数'}]}:undefined,
  takeaways:[{icon:'⚠',title:'证据有边界',desc:'只在同一任务、数据集和评估协议内比较。'},{icon:'↔',title:'操作先于术语',desc:'先改变一个条件，再观察模型输出。'},{icon:'✓',title:'结论要可复现',desc:'记录数据来源、算法和指标方向。'}]
});

export const tutorial: TutorialData = {
  meta:{titleEn:'What Matters in Learning from Offline Human Demonstrations for Robot Manipulation',titleZh:'从离线人类示范中学什么？机器人操作学习实证教程',venue:'arXiv:2108.03298v2 · 2021',authors:'Ajay Mandlekar 等 10 位作者',affiliation:'Stanford University · The University of Texas at Austin',domain:'机器人操作 · 模仿学习 · 离线强化学习',coreProblem:'机器人要从人类遥操作轨迹学会多阶段操作，但示范有噪声、历史依赖，训练损失也不等于任务成功率。',coreInsight:'论文用 8 个操作任务、3 类数据质量和 6 种算法拆开验证：历史信息、示范质量、观测与超参数、数据规模和策略选择标准都会改变成功率。',keywords:['离线学习','人类示范','BC-RNN','数据质量','策略选择']},
  hero:{oldMethod:{desc:'只看当前画面直接模仿动作，遇到分布外状态时误差会累积。',componentId:'paper-hero'},newMethod:{desc:'把历史、数据质量与评估协议一起纳入设计，再用真实成功率选择策略。',componentId:'paper-hero'}},
  chapters:[
    chapter(1,'为什么“看过示范”还不够？','inf','问题','传统监督学习常用验证损失选模型，但机器人操作是连续动力系统。论文第 2 节把缺口拆成五个挑战。','先看球场：机器人像在练投篮',[{id:'1.1',title:'五个挑战的权重',desc:'点击挑战标签，观察它们分别对应数据、时间、选择和设计决策。证据：论文第 2 节 C1-C5。'},{id:'1.2',title:'训练指标与成功率',desc:'切换指标，比较“损失最低”和“任务成功”并不总是同一个检查点。'}]),
    chapter(2,'示范到底包含什么信息？','inf','数据','论文区分机器生成、熟练人类和多人混合数据，并同时记录低维状态、动作、图像和可选奖励。','整理练习录像',[{id:'2.1',title:'观测空间开关',desc:'切换低维状态与图像观测，查看输入维度和论文第 3.2 节的实验路径。'}]),
    chapter(3,'为什么历史信息很关键？','inf','洞见','人类操作不是只由当前画面决定。论文用历史依赖策略检验遥操作器、过去动作和回合上下文的作用。','记住上一次出手',[{id:'3.1',title:'单帧 vs 历史窗口',desc:'拖动历史窗口长度，观察输入从单帧变成时间序列。'},{id:'3.2',title:'Table 1 复核',desc:'选择任务，读取 BC 与 BC-RNN 在 PH/MH 低维数据上的成功率。'}],'在多人或人类数据上，BC-RNN、HBC、IRIS 等时间模型通常更稳，这是论文实验结论。'),
    chapter(4,'六种算法在学什么？','both','机制','论文比较 BC、BC-RNN、HBC、BCQ、CQL 和 IRIS，重点是不同监督与价值假设。','选择训练教练',[{id:'4.1',title:'算法机制卡片',desc:'点击算法，查看它使用动作监督、历史、层级或价值估计的哪一部分。'}]),
    chapter(5,'示范质量会把答案推向哪里？','both','条件','多人示范包含较好、一般和较差操作者。论文发现批量 RL 在混合质量人类数据上常常失效。','把不同水平的训练球放在一起',[{id:'5.1',title:'混合质量滑杆',desc:'改变较差/一般/较好示范比例，查看成功率趋势。'},{id:'5.2',title:'Can 任务结果',desc:'切换子集，读取 Table 2 中 Can-Worse、Can-Okay、Can-Better 的真实数值。'}]),
    chapter(6,'数据越多，任务就越容易吗？','inf','规模','论文用 20%、50%、100% 数据量做消融，显示复杂任务更依赖覆盖范围。','从少量投篮到完整训练集',[{id:'6.1',title:'数据量消融',desc:'选择任务和观测，查看 Table 27/28 的 20%、50%、100% 成功率。'}]),
    chapter(7,'观测与超参数为何如此敏感？','trn','训练','加入速度、关节或随机裁剪会改变输入分布。Figure 2 与 Table 25-26 展示了这种敏感性。','换摄像机和出手节奏',[{id:'7.1',title:'观测增量',desc:'点击 EEF 速度、关节、去掉随机裁剪或腕部相机，查看相对成功率变化。'},{id:'7.2',title:'BC-RNN 超参数',desc:'选择学习率、GMM、MLP、RNN 维度，读取 Table 26 的敏感性方向。'}]),
    chapter(8,'如何读懂策略选择？','trn','选择','验证损失最低的检查点可能不是成功率最高的检查点；论文用 50 次 rollout 评估每个检查点。','决定哪一版动作上场',[{id:'8.1',title:'检查点选择器',desc:'沿训练轮次移动，比较验证损失与成功率；绿色点是成功率最高的检查点。'}]),
    chapter(9,'把证据搬到真实机器人上','trn','迁移','Lift、Can、Tool Hang 也有真实任务。仿真中的观测和历史选择要在真实感知噪声下重新检查。','从训练馆到正式球场',[{id:'9.1',title:'任务难度阶梯',desc:'点击 Lift、Can、Square、Transport、Tool Hang，查看操作复杂度。'},{id:'9.2',title:'真实部署检查',desc:'切换仿真/真实/图像，显示需要重新验证的传感器与评估条件。'}]),
    chapter(10,'用一张证据卡总结论文','both','结论','论文标出离线人类数据的条件边界：它能解决多阶段任务，但算法、数据和评估选择必须透明。','赛后复盘而非只看比分',[{id:'10.1',title:'证据赛道',desc:'切换三条主结论，查看实验位置、指标方向和适用条件。'},{id:'10.2',title:'复现清单',desc:'勾选任务、数据、算法、评估和开源资源，生成最小复现实验卡。'}],'论文没有声称某个算法在所有任务上最优；它提供的是固定协议、做消融、报告条件、开放数据的方法。')
  ]
};
