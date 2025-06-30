import React, { useRef, useState, useCallback } from "react";
import {
	Camera as CameraIcon,
	Upload,
	RotateCcw,
	Check,
	X,
	AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Camera } from "react-camera-pro";

interface CameraCaptureProps {
	onImageCapture: (imageBlob: Blob) => void;
	onCancel?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
	onImageCapture,
	onCancel,
}) => {
	const cameraRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropZoneRef = useRef<HTMLDivElement>(null);

	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [cameraSupported, setCameraSupported] = useState(true);
	const [cameraActive, setCameraActive] = useState(false);

	// Validate file
	const validateFile = (file: File): string | null => {
		if (!file.type.startsWith("image/")) {
			return "Please select a valid image file.";
		}
		if (file.size > 10 * 1024 * 1024) {
			return "Image file is too large. Please select a file under 10MB.";
		}
		return null;
	};

	// Process file upload
	const processFile = useCallback(async (file: File) => {
		const error = validateFile(file);
		if (error) {
			setError(error);
			return;
		}
		try {
			const blob = new Blob([file], { type: file.type });
			const imageUrl = URL.createObjectURL(blob);
			setCapturedImage(imageUrl);
			setError(null);
		} catch (err) {
			setError("Failed to process the selected file.");
		}
	}, []);

	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;
			processFile(file);
		},
		[processFile],
	);

	// Drag and drop handlers
	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			const rect = dropZoneRef.current?.getBoundingClientRect();
			if (rect) {
				const x = e.clientX;
				const y = e.clientY;
				if (
					x < rect.left ||
					x > rect.right ||
					y < rect.top ||
					y > rect.bottom
				) {
					setDragActive(false);
				}
			}
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				const file = e.dataTransfer.files[0];
				processFile(file);
			}
		},
		[processFile],
	);

	// Confirm image (from camera or upload)
	const confirmImage = useCallback(async () => {
		if (!capturedImage) return;
		try {
			setIsLoading(true);
			const response = await fetch(capturedImage);
			const blob = await response.blob();
			onImageCapture(blob);
			URL.revokeObjectURL(capturedImage);
			setCapturedImage(null);
		} catch (err) {
			setError("Failed to process image. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}, [capturedImage, onImageCapture]);

	// Retake photo
	const retakePhoto = useCallback(() => {
		if (capturedImage) {
			URL.revokeObjectURL(capturedImage);
			setCapturedImage(null);
		}
		setError(null);
	}, [capturedImage]);

	// Browse for file
	const handleBrowseClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, []);

	// Camera error handler
	const handleCameraError = (err: any) => {
		setCameraSupported(false);
		if (
			err?.name === "NotAllowedError" ||
			err?.name === "PermissionDeniedError"
		) {
			setPermissionDenied(true);
			setError(
				"Camera permission denied. Please allow camera access or upload a file instead.",
			);
		} else {
			setError(
				"Unable to access camera. Please check permissions or try uploading a file.",
			);
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<div className="space-y-4 p-4 sm:p-pixel-2">
				{/* Error Display */}
				{error && (
					<div className="bg-retro-error bg-opacity-10 border-2 border-retro-error rounded-pixel p-3">
						<div className="flex items-start gap-2">
							<AlertTriangle className="w-5 h-5 text-retro-error flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-retro-error font-pixel-sans text-sm">
									{error}
								</p>
								{permissionDenied && (
									<div className="mt-2 text-xs text-retro-error font-pixel-sans">
										<p>
											<strong>To enable camera:</strong>
										</p>
										<ul className="list-disc list-inside mt-1 space-y-1">
											<li>
												Click the camera icon in your browser's address bar
											</li>
											<li>Select "Allow" for camera permissions</li>
											<li>Refresh the page and try again</li>
										</ul>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Camera/Image Display Area */}
				<div
					ref={dropZoneRef}
					className={`relative bg-retro-bg-tertiary rounded-pixel overflow-hidden aspect-video transition-all duration-200 ${
						dragActive
							? "border-4 border-retro-accent-light bg-retro-accent bg-opacity-10 scale-105"
							: "border-2 border-retro-accent"
					}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}>
					{/* Loading Overlay */}
					{isLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-retro-bg-tertiary z-10">
							<div className="text-center">
								<LoadingSpinner size="lg" />
								<p className="mt-2 text-retro-accent font-pixel-sans text-sm">
									Capturing...
								</p>
							</div>
						</div>
					)}

					{/* Drag Overlay */}
					{dragActive && (
						<div className="absolute inset-0 flex items-center justify-center bg-retro-accent bg-opacity-20 z-20">
							<div className="text-center text-retro-accent">
								<Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 animate-pixel-pulse" />
								<p className="font-pixel text-base sm:text-lg">
									Drop image here
								</p>
								<p className="font-pixel-sans text-sm">Release to upload</p>
							</div>
						</div>
					)}

					{/* Content Display */}
					{capturedImage ? (
						<img
							src={capturedImage}
							alt="Captured item"
							className="w-full h-full object-cover"
						/>
					) : cameraActive && cameraSupported ? (
						<Camera
							ref={cameraRef}
							facingMode="environment"
							aspectRatio={16 / 9}
							errorMessages={{
								noCameraAccessible:
									"Camera not supported in this browser. Please use a modern browser or upload a file instead.",
								permissionDenied:
									"Camera permission denied. Please allow camera access or upload a file instead.",
								switchCamera: "Cannot switch camera.",
								canvas: "Canvas is not supported.",
							}}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="flex items-center justify-center h-full text-retro-accent-light">
							<div className="text-center p-4">
								<CameraIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
								<p className="font-pixel-sans">Camera preview will appear here</p>
								<p className="font-pixel-sans text-sm mt-2">
									Or drag & drop an image file
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Control Buttons */}
				<div className="flex flex-wrap gap-3 justify-center">
					{!capturedImage ? (
						<>
							{!cameraActive ? (
								<Button
									variant="accent"
									icon={CameraIcon}
									onClick={() => setCameraActive(true)}
									disabled={isLoading || !cameraSupported}
									className="min-h-[44px] min-w-[44px]"
								>
									{!cameraSupported ? "Camera Not Available" : "Start capture"}
								</Button>
							) : (
								<Button
									variant="accent"
									icon={CameraIcon}
									onClick={() => {
										if (cameraRef.current) {
											const photo = cameraRef.current.takePhoto();
											if (photo) {
												setCapturedImage(photo);
											} else {
												setError("Failed to capture photo. Please try again.");
											}
										}
									}}
									disabled={isLoading || !cameraSupported}
									className="min-h-[44px] min-w-[44px]"
								>
									Take Photo
								</Button>
							)}

							<Button
								variant="primary"
								icon={Upload}
								onClick={handleBrowseClick}
								disabled={isLoading}
								className="min-h-[44px] min-w-[44px]">
								Upload File
							</Button>

							{onCancel && (
								<Button
									variant="ghost"
									icon={X}
									onClick={onCancel}
									disabled={isLoading}
									className="min-h-[44px] min-w-[44px]">
									Cancel
								</Button>
							)}
						</>
					) : (
						<>
							<Button
								variant="accent"
								icon={Check}
								onClick={confirmImage}
								disabled={isLoading}
								glow
								className="min-h-[44px] min-w-[44px]">
								Use This Photo
							</Button>

							<Button
								variant="ghost"
								icon={RotateCcw}
								onClick={retakePhoto}
								disabled={isLoading}
								className="min-h-[44px] min-w-[44px]">
								Retake
							</Button>
						</>
					)}
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
					className="hidden"
					onClick={(e) => e.stopPropagation()}
				/>
			</div>
		</Card>
	);
};
