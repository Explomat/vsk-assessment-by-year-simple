import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getItems, selectItem, onSetParams } from './listActions';
import { Modal, List, Checkbox, Avatar, Input } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import './list.css';

class Ilist extends Component {

	constructor(props) {
		super(props);
		
		props.onSetParams(props.commonParams);
	}

	componentDidMount() {
		const { type, getItems } = this.props;
		getItems(type);
	}

	render() {
		const {
			title,
			type,
			list,
			selectedItems,
			ui,
			meta,
			selectItem,
			getItems
		} = this.props;

		const { onCancel, onOk } = this.props;

		return (
			<Modal
				width = {820}
				title={title}
				okText='Выбрать'
				okButtonProps={{
					disabled: false
				}}
				cancelText='Отмена'
				visible
				onCancel={onCancel}
				onOk={() => onOk(selectedItems)}
			>
				<div className='list'>
					<Input
						className='list__search'
						allowClear
						placeholder='Поиск'
						prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
						onPressEnter={(e) => getItems(type, 1, null, e.target.value)}
					/>
					<List
						size='small'
						itemLayout = 'horizontal'
						loading = {ui.isLoading}
						dataSource = {list}
						pagination = {
							{
								onChange: (page, pageSize) => {
									getItems(type, page, pageSize);
								},
								current: meta.page,
								pageSize: meta.pageSize,
								total: meta.total,
								showSizeChanger: false
							}
						}
						renderItem={item => (
							<List.Item
								key={item.id}
								actions={[<Checkbox key={1} checked={item.checked} onChange={(e) => selectItem(e.target.checked, item)}>Выбрать</Checkbox>]}
							>
								<List.Item.Meta
									avatar={<Avatar src={item.pict_url} />}
									title={item.name}
									description={item.description}
								/>
							</List.Item>
						)}
					/>
					{selectedItems.length > 0 && (
						<div className='selected-list-container'>
							<h3>Выбранные элементы</h3>
							<div className='selected-list'>
								<List
									itemLayout = 'horizontal'
									dataSource = {selectedItems}
									renderItem={item => (
										<List.Item
											key={item.id}
											actions={[<DeleteOutlined style={{ fontSize: '17px' }} onClick={() => selectItem(false, item)} />]}
										>
											<List.Item.Meta
												avatar={<Avatar src={item.pict_url} />}
												title={item.name}
											/>
										</List.Item>
									)}
								/>
							</div>
						</div>
					)}
				</div>
			</Modal>
		);
	}
}


function mapStateToProps(state){
	return {
		...state.components.listComponent
	}
}

export default connect(mapStateToProps, { getItems, selectItem, onSetParams })(Ilist);
