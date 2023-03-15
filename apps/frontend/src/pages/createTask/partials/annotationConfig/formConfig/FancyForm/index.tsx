import type { FormItemProps } from 'antd';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React from 'react';

import FancyInput from '../FancyInput';
import type { FancyItemIdentifier } from '../FancyInput/types';

export interface FancyFormProps {
  // TODO: 完善类型
  template: FancyItemIdentifier[];
  name: NamePath;
  value?: any;
}

export interface FancyGroupProps {
  group: FancyItemIdentifier[];
  value?: any;
  name: NamePath;
}

export interface FancyFormItemProps extends FormItemProps {
  children: React.ReactNode;
}

export const FancyGroup: React.FC<FancyGroupProps> = ({ group, value, name }) => {
  if (Array.isArray(group)) {
    return (
      <>
        {group.map((itemConfig) => {
          const { label, rules, type, children, key, field, initialValue, hidden } = itemConfig;
          let finalName: NamePath = [field];

          if (typeof field === 'undefined' || field === null) {
            finalName = name;
          } else if (Array.isArray(name)) {
            finalName = [...name, field];
          } else {
            finalName = [name, field];
          }

          if (type === 'group' && Array.isArray(children)) {
            return (
              <Form.Item
                key={key}
                label={label}
                rules={rules}
                preserve={false}
                initialValue={initialValue}
                hidden={hidden}
              >
                <FancyGroup key={key} group={children} value={value} name={finalName} />
              </Form.Item>
            );
          }

          return (
            <Form.Item
              key={key}
              label={label}
              preserve={false}
              name={finalName}
              rules={rules}
              initialValue={initialValue}
              hidden={hidden}
            >
              <FancyInput {...itemConfig} fullField={finalName} />
            </Form.Item>
          );
        })}
      </>
    );
  }

  // eslint-disable-next-line no-console
  console.warn('FancyGroup: group is not an array');

  return null;
};

export default function FancyForm(props: FancyFormProps) {
  // TODO: 校验template有效性
  const { template, ...restProps } = props;

  return <FancyGroup group={template} {...restProps} />;
}
