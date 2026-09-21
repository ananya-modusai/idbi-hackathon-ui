import React, { useState } from 'react';
import { Button } from '../../../components/custom/CustomButton';

interface ChangePasswordProps {
	onClose?: () => void;
	onSubmit?: (data: { oldPassword: string; newPassword: string }) => void;
}


const eyeOpen = (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
		<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
		<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
	</svg>
);
const eyeClosed = (
	<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
		<path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.53 6.53C4.06 8.36 2.25 12 2.25 12s3.75 6.75 9.75 6.75c2.13 0 4.07-.57 5.72-1.53M17.47 17.47C19.94 15.64 21.75 12 21.75 12s-3.75-6.75-9.75-6.75c-2.13 0-4.07.57-5.72 1.53" />
	</svg>
);

const passwordRegex = /[!@#$%^&*(),.?":{}|<>]/;

const ChangePassword: React.FC<ChangePasswordProps> = ({ onClose, onSubmit }) => {
	const [oldPassword, setOldPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState('');

	// Live validation
	let errorMsg = '';
	if (newPassword && oldPassword && newPassword === oldPassword) {
		errorMsg = 'New password cannot match old password';
	} else if (newPassword && !passwordRegex.test(newPassword)) {
		errorMsg = 'Special character required';
	} else if (confirmPassword && newPassword !== confirmPassword) {
		errorMsg = 'Passwords do not match';
	}

	const isValid =
		oldPassword.length > 0 &&
		newPassword.length > 0 &&
		confirmPassword.length > 0 &&
		passwordRegex.test(newPassword) &&
		newPassword !== oldPassword &&
		newPassword === confirmPassword;

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValid) {
			setError(errorMsg || 'Please fix errors above');
			return;
		}
		setError('');
		if (onSubmit) {
			onSubmit({ oldPassword, newPassword });
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
				<h2 className="text-2xl font-semibold mb-6">Change Password</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Old Password</label>
						<div className="relative">
							<input
								type={showOld ? 'text' : 'password'}
								className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 pr-10"
								value={oldPassword}
								onChange={e => setOldPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								className="absolute right-2 top-2 text-gray-500"
								tabIndex={-1}
								onClick={() => setShowOld(v => !v)}
								aria-label={showOld ? 'Hide password' : 'Show password'}
							>
								{showOld ? eyeOpen : eyeClosed}
							</button>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">New Password</label>
						<div className="relative">
							<input
								type={showNew ? 'text' : 'password'}
								className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 pr-10"
								value={newPassword}
								onChange={e => setNewPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								className="absolute right-2 top-2 text-gray-500"
								tabIndex={-1}
								onClick={() => setShowNew(v => !v)}
								aria-label={showNew ? 'Hide password' : 'Show password'}
							>
								{showNew ? eyeOpen : eyeClosed}
							</button>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Confirm New Password</label>
						<div className="relative">
							<input
								type={showConfirm ? 'text' : 'password'}
								className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 pr-10"
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								required
							/>
							<button
								type="button"
								className="absolute right-2 top-2 text-gray-500"
								tabIndex={-1}
								onClick={() => setShowConfirm(v => !v)}
								aria-label={showConfirm ? 'Hide password' : 'Show password'}
							>
								{showConfirm ? eyeOpen : eyeClosed}
							</button>
						</div>
					</div>
					{(errorMsg || error) && (
						<div className="text-red-500 text-sm">
							{errorMsg || error}
						</div>
					)}
					<div className="flex justify-center mt-4">
						<Button type="submit" variant="default" disabled={!isValid}>
							Submit
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ChangePassword;
