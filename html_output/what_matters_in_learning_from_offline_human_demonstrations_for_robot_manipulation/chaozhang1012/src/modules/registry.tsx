import React from 'react';
import {PaperWidget, PaperScene, PaperHero} from './paperWidgets';
export interface WidgetProps { chapterId:string; moduleId:string; }
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['paper-module']=PaperWidget;
widgetRegistry['paper-scene']=PaperScene;
widgetRegistry['paper-hero']=PaperHero;
