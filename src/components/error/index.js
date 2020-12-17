import React from 'react';
import { Alert, Modal } from 'antd';

const ErrorAlert = ({ message, description, visible, onClose }) => {
	return (
		<Modal
			closable
			title='Ошибка'
			visible={visible}
			footer={null}
			onCancel={onClose}
		>
			<Alert
				message={message}
				description={description}
				type='error'
			/>
		</Modal>
	);
}

export default ErrorAlert;