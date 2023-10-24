import React from 'react';
import type { FormInstance } from 'antd';

import type { TaskLoaderResult } from '@/loaders/task.loader';

import type { QueuedFile } from './partials/InputData1';

export interface TaskCreationContextValue {
  task: NonNullable<TaskLoaderResult['task']>;
  uploadFileList: QueuedFile[];
  setUploadFileList: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  annotationFormInstance: FormInstance;
  basicFormInstance: FormInstance;
  onAnnotationFormChange: () => void;
  selectedTemplate: unknown;
  onTemplateSelect: (template: unknown) => void;
}

export const TaskCreationContext = React.createContext<TaskCreationContextValue>({} as TaskCreationContextValue);
