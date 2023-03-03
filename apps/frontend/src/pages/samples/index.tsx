import React, { useState, useEffect } from 'react';
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Pagination, Modal } from 'antd';
import _ from 'lodash-es';
import moment from 'moment';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import type { Dispatch, RootState } from '@/store';
import { SampleState, TaskStatus } from '@/services/types';

import currentStyles from './index.module.scss';
import Statistical from '../../components/statistical';
import GoToEditTask from './components/GoToEditTask';
import commonController from '../../utils/common/common';
import { outputSample } from '../../services/samples';
import statisticalStyles from '../../components/statistical/index.module.scss';
import currentStyles1 from '../outputData/index.module.scss';

const Samples = () => {
  const navigate = useNavigate();
  const taskData = useRouteLoaderData('task');
  const dispatch = useDispatch<Dispatch>();
  const taskId = _.get(taskData, 'id');

  // 查询参数
  const [searchParams, setSearchParams] = useSearchParams(
    new URLSearchParams({
      // 默认按照最后更新时间倒序
      pageNo: '1',
      pageSize: '10',
    }),
  );

  const taskStatus = _.get(taskData, 'status');
  const isTaskReadyToAnnotate = ![TaskStatus.DRAFT, TaskStatus.IMPORTED].includes(taskStatus!);
  const {
    meta_data = {
      total: 0,
    },
    data: samples,
  } = useSelector((state: RootState) => state.sample.list);

  // 初始化获取样本列表
  useEffect(() => {
    dispatch.sample.fetchSamples({
      task_id: +taskId!,
      ...Object.fromEntries(searchParams.entries()),
    });
  }, [dispatch.sample, searchParams, taskId]);

  const [enterRowId, setEnterRowId] = useState<any>(undefined);
  const [deleteSampleIds, setDeleteSampleIds] = useState<any>([]);

  const handleDeleteSample = (ids: number[]) => {
    Modal.confirm({
      title: '确认要删除这条数据吗？',
      icon: <ExclamationCircleOutlined />,
      onOk() {
        dispatch.sample
          .deleteSamples({
            task_id: taskId!,
            body: {
              sample_ids: ids,
            },
          })
          .then(() => {
            commonController.notificationSuccessMessage({ message: '删除成功' }, 1);
          });
        dispatch.sample.fetchSamples({
          task_id: +taskId!,
          ...Object.fromEntries(searchParams.entries()),
        });
      },
    });
  };

  const turnToAnnotate = (sampleId: number) => {
    navigate(`/tasks/${taskId}/samples/${sampleId}`);
  };

  const columns: any = [
    {
      title: '数据ID',
      dataIndex: 'id',
      key: 'id',
      align: 'left',
    },
    {
      title: '数据预览',
      dataIndex: 'data',
      key: 'packageID',
      align: 'left',
      render: (data: any) => {
        let url = '';
        for (const sampleId in data.urls) {
          url = data.urls[sampleId];
        }
        return <img src={url} style={{ width: '116px', height: '70px' }} />;
      },
    },
    {
      title: '标注情况',
      dataIndex: 'state',
      key: 'packageID',
      align: 'left',

      render: (text: string) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }

        const icons: Record<SampleState, React.ReactNode> = {
          [SampleState.DONE]: <div className={statisticalStyles.leftTitleContentOptionBlueIcon} />,
          [SampleState.NEW]: <div className={statisticalStyles.leftTitleContentOptionGrayIcon} />,
          [SampleState.SKIPPED]: <div className={statisticalStyles.leftTitleContentOptionOrangeIcon} />,
        };

        const texts: Record<SampleState, string> = {
          [SampleState.DONE]: '已标注',
          [SampleState.NEW]: '未标注',
          [SampleState.SKIPPED]: '跳过',
        };

        return (
          <div className={currentStyles.leftTitleContentOption}>
            {icons[text as SampleState]}
            <div className={statisticalStyles.leftTitleContentOptionContent}>{texts[text as SampleState]}</div>
          </div>
        );
      },
      sorter: true,
    },
    {
      title: '标注数',
      dataIndex: 'annotated_count',
      key: 'annotated_count',
      align: 'left',

      render: (temp: any, record: any) => {
        let result = 0;
        const resultJson = JSON.parse(record.data.result);
        for (const key in resultJson) {
          if (key.indexOf('Tool') > -1 && key !== 'textTool' && key !== 'tagTool') {
            const tool = resultJson[key];
            if (!tool.result) {
              let _temp = 0;
              if (tool.length) {
                _temp = tool.length;
              }
              result = result + _temp;
            } else {
              result = result + tool.result.length;
            }
          }
        }
        return result;
      },
      sorter: true,

      // width: 80,
    },
    {
      title: '标注者',
      dataIndex: 'created_by',
      key: 'created_by',
      align: 'left',

      render: (created_by: any) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }
        return created_by.username;
      },
    },
    {
      title: '上次标注时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      align: 'left',

      // width : 310,
      render: (updated_at: any) => {
        if (!isTaskReadyToAnnotate) {
          return '';
        }
        return moment(updated_at).format('YYYY-MM-DD HH:MM');
      },
    },
    {
      title: '',
      dataIndex: 'option',
      key: 'option',
      width: 180,
      align: 'left',

      render: (x: any, record: any) => {
        return (
          <React.Fragment>
            {record.id === enterRowId && (
              <div className={currentStyles.optionItem}>
                {isTaskReadyToAnnotate && (
                  <div className={currentStyles.optionItemEnter} onClick={() => turnToAnnotate(record.id)}>
                    进入标注
                  </div>
                )}
                <div className={currentStyles.optionItemDelete} onClick={() => handleDeleteSample([record.id])}>
                  删除
                </div>
              </div>
            )}
          </React.Fragment>
        );
      },
    },
  ];

  const rowSelection = {
    columnWidth: 58,
    onChange: (selectedKeys: any) => {
      setDeleteSampleIds(Object.assign([], deleteSampleIds, selectedKeys));
    },
    getCheckboxProps: (record: any) => {
      return {
        disabled: false, // Column configuration not to be checked
        name: record.packageID,
        key: record.packageID,
      };
    },
    selectedKeys: () => {},
  };

  // @ts-ignore
  const handleTableChange = (pagination, filters, sorter) => {
    if (!_.isEmpty(pagination)) {
      searchParams.set('pageNo', `${pagination.current}`);
      searchParams.set('pageSize', `${pagination.pageSize}`);
    }

    if (sorter) {
      let sortValue = '';
      switch (sorter.order) {
        case 'ascend':
          sortValue = 'asc';
          break;
        case 'descend':
          sortValue = 'desc';
          break;
        case undefined:
          sortValue = 'desc';
          break;
      }
      searchParams.set('sort', `${_.get(sorter, 'field')}:${sortValue}`);
    } else {
      searchParams.delete('sort');
    }

    setSearchParams(searchParams);
  };
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set('pageNo', `${page}`);
    searchParams.set('pageSize', `${pageSize}`);
    setSearchParams(searchParams);
  };

  const onMouseEnterRow = (rowId: any) => {
    setEnterRowId(rowId);
  };
  const onRow = (record: any) => {
    return {
      onMouseLeave: () => setEnterRowId(undefined),
      onMouseOver: () => {
        onMouseEnterRow(record.id);
      },
    };
  };

  const [activeTxt, setActiveTxt] = useState('JSON');
  const [isShowModal1, setIsShowModal1] = useState(false);
  const clickOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal1(false);
    outputSample(taskId!, deleteSampleIds, activeTxt).catch((error) => {
      commonController.notificationErrorMessage(error, 1);
    });
  };

  const clickCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowModal1(false);
  };
  const confirmActiveTxt = (e: any, value: string) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setActiveTxt(value);
  };

  // @ts-ignore
  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        {isTaskReadyToAnnotate ? <Statistical /> : <GoToEditTask taskStatus={taskStatus} />}
      </div>
      <div className={currentStyles.content}>
        <Table
          columns={columns}
          dataSource={samples || []}
          pagination={false}
          rowKey={(record) => record.id!}
          rowSelection={rowSelection}
          onRow={onRow}
          onChange={handleTableChange}
        />
        <div className={currentStyles.pagination}>
          <div className={currentStyles.dataProcess}>
            <div
              className={currentStyles.dataProcessDelete}
              onClick={(e: any) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopPropagation();
                if (deleteSampleIds.length === 0) {
                  commonController.notificationErrorMessage({ message: '请先勾选需要删除的数据' }, 1);
                  return;
                }
              }}
            >
              批量删除
            </div>
            <div
              className={currentStyles.dataProcessOutput}
              onClick={(e: any) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopPropagation();
                if (deleteSampleIds.length === 0) {
                  commonController.notificationErrorMessage({ message: '请先勾选需要导出的数据' }, 1);
                  return;
                }
                setIsShowModal1(true);
              }}
            >
              批量数据导出
            </div>
          </div>
          <Pagination
            current={parseInt(searchParams.get('pageNo') || '1')}
            pageSize={parseInt(searchParams.get('pageSize') || '10')}
            total={meta_data?.total}
            showSizeChanger
            showQuickJumper
            onChange={handlePaginationChange}
          />
        </div>
      </div>
      <Modal title="选择导出格式" okText={'导出'} onOk={clickOk} onCancel={clickCancel} open={isShowModal1}>
        <div className={currentStyles1.outerFrame}>
          <div className={currentStyles1.pattern}>
            <div className={currentStyles1.title}>导出格式</div>
            <div className={currentStyles1.buttons}>
              {activeTxt === 'JSON' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'JSON')}>
                  JSON
                </div>
              )}
              {activeTxt !== 'JSON' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'JSON')}>
                  JSON
                </div>
              )}

              {activeTxt === 'COCO' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'COCO')}>
                  COCO
                </div>
              )}
              {activeTxt !== 'COCO' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'COCO')}>
                  COCO
                </div>
              )}

              {activeTxt === 'MASK' && (
                <div className={currentStyles1.buttonActive} onClick={(e) => confirmActiveTxt(e, 'MASK')}>
                  MASK
                </div>
              )}
              {activeTxt !== 'MASK' && (
                <div className={currentStyles1.button} onClick={(e) => confirmActiveTxt(e, 'MASK')}>
                  MASK
                </div>
              )}
            </div>
          </div>
          {activeTxt === 'JSON' && (
            <div className={currentStyles.bottom}>Label U 标准格式，包含任务id、标注结果、url、fileName字段</div>
          )}
          {activeTxt === 'COCO' && (
            <div className={currentStyles.bottom}>COCO数据集标准格式，面向物体检测（拉框）和图像分割（多边形）任务</div>
          )}
          {activeTxt === 'MASK' && <div className={currentStyles.bottom}>面向图像分割（多边形）任务</div>}
        </div>
      </Modal>
    </div>
  );
};

export default Samples;
