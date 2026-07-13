import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Printer, ZoomIn, ZoomOut, RotateCcw, Sun, Aperture, Copy, ImageOff, Contrast } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "./auth";

const DPI = 300;
const mm2px = (mm) => Math.round((mm / 25.4) * DPI);

const SIZE_PRESETS = [
	{ id: "in35x45", label: "India / UK / EU passport — 35 × 45 mm", w: 35, h: 45 },
	{ id: "us2x2", label: "US passport / visa — 2 × 2 in", w: 50.8, h: 50.8 },
	{ id: "cn33x48", label: "China visa — 33 × 48 mm", w: 33, h: 48 },
	{ id: "sq40x40", label: "Square ID photo — 40 × 40 mm", w: 40, h: 40 },
	{ id: "custom", label: "Custom size", w: 35, h: 45 },
];

const PAPER_PRESETS = [
	{ id: "4x6", label: "4 × 6 in photo paper", w: 101.6, h: 152.4 },
	{ id: "5x7", label: "5 × 7 in photo paper", w: 127, h: 177.8 },
	{ id: "a4", label: "A4 sheet", w: 210, h: 297 },
	{ id: "letter", label: "Letter sheet", w: 215.9, h: 279.4 },
];

const GUTTER_MM = 3;
const MARGIN_MM = 5;

export default function PassportPhotoMaker() {
	const navigate = useNavigate();
	const [hasImage, setHasImage] = useState(false);
	const [sizeId, setSizeId] = useState("in35x45");
	const [customW, setCustomW] = useState(35);
	const [customH, setCustomH] = useState(45);
	const [brightness, setBrightness] = useState(0);
	const [contrast, setContrast] = useState(0);
	const [grayscale, setGrayscale] = useState(false);
	const [zoom, setZoom] = useState(1);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [copies, setCopies] = useState(6);
	const [paperId, setPaperId] = useState("4x6");
	const [maxCopies, setMaxCopies] = useState(1);
	const [dragging, setDragging] = useState(false);
	const [printSrc, setPrintSrc] = useState(null);
	const [fileName, setFileName] = useState("");

	const imgRef = useRef(null);
	const photoCanvasRef = useRef(null);
	const sheetCanvasRef = useRef(null);
	const previewWrapRef = useRef(null);
	const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

	const preset = SIZE_PRESETS.find((s) => s.id === sizeId);
	const photoWmm = sizeId === "custom" ? customW : preset.w;
	const photoHmm = sizeId === "custom" ? customH : preset.h;
	const paper = PAPER_PRESETS.find((p) => p.id === paperId);

	const handleFile = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				imgRef.current = img;
				setHasImage(true);
				setZoom(1);
				setOffset({ x: 0, y: 0 });
			};
			img.src = e.target.result;
		};
		setFileName(file.name);
		reader.readAsDataURL(file);
	};

	const drawPhoto = useCallback(() => {
		const canvas = photoCanvasRef.current;
		const img = imgRef.current;
		if (!canvas || !img) return;
		const w = mm2px(photoWmm);
		const h = mm2px(photoHmm);
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) grayscale(${grayscale ? 100 : 0}%)`;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, w, h);
		const targetRatio = w / h;
		const imgRatio = img.width / img.height;
		const baseScale = imgRatio > targetRatio ? h / img.height : w / img.width;
		const scale = baseScale * zoom;
		const drawW = img.width * scale;
		const drawH = img.height * scale;
		const scaleFactor = w / (canvas.clientWidth || w);
		const dx = (w - drawW) / 2 + offset.x * scaleFactor;
		const dy = (h - drawH) / 2 + offset.y * scaleFactor;
		ctx.drawImage(img, dx, dy, drawW, drawH);
	}, [photoWmm, photoHmm, brightness, contrast, grayscale, zoom, offset]);

	const drawSheet = useCallback(() => {
		const photoCanvas = photoCanvasRef.current;
		const sheetCanvas = sheetCanvasRef.current;
		if (!photoCanvas || !sheetCanvas || !hasImage) return;
		const paperWpx = mm2px(paper.w);
		const paperHpx = mm2px(paper.h);
		const photoWpx = mm2px(photoWmm);
		const photoHpx = mm2px(photoHmm);
		const gutterPx = mm2px(GUTTER_MM);
		const marginPx = mm2px(MARGIN_MM);

		const cols = Math.max(1, Math.floor((paperWpx - 2 * marginPx + gutterPx) / (photoWpx + gutterPx)));
		const rows = Math.max(1, Math.floor((paperHpx - 2 * marginPx + gutterPx) / (photoHpx + gutterPx)));
		const cap = cols * rows;
		setMaxCopies(cap);
		const n = Math.min(copies, cap);

		sheetCanvas.width = paperWpx;
		sheetCanvas.height = paperHpx;
		const ctx = sheetCanvas.getContext("2d");
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, paperWpx, paperHpx);

		const usedCols = Math.min(cols, n);
		const usedRows = Math.ceil(n / cols);
		const gridW = usedCols * photoWpx + (usedCols - 1) * gutterPx;
		const gridH = usedRows * photoHpx + (usedRows - 1) * gutterPx;
		const startX = marginPx;
		const startY = marginPx;

		const tick = Math.max(6, Math.round(mm2px(2)));
		ctx.strokeStyle = "#c9c4b8";
		ctx.lineWidth = 1;

		for (let i = 0; i < n; i++) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const x = startX + col * (photoWpx + gutterPx);
			const y = startY + row * (photoHpx + gutterPx);
			ctx.drawImage(photoCanvas, x, y, photoWpx, photoHpx);
			// corner crop marks
			const corners = [
				[x, y, 1, 1],
				[x + photoWpx, y, -1, 1],
				[x, y + photoHpx, 1, -1],
				[x + photoWpx, y + photoHpx, -1, -1],
			];
			corners.forEach(([cx, cy, sx, sy]) => {
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(cx + tick * sx, cy);
				ctx.moveTo(cx, cy);
				ctx.lineTo(cx, cy + tick * sy);
				ctx.stroke();
			});
		}
	}, [paper, photoWmm, photoHmm, copies, hasImage, brightness, contrast, grayscale, zoom, offset]);

	useEffect(() => {
		if (hasImage) drawPhoto();
	}, [hasImage, drawPhoto]);

	useEffect(() => {
		if (hasImage) drawSheet();
	}, [hasImage, drawSheet]);

	const onPointerDown = (e) => {
		setDragging(true);
		const p = e.touches ? e.touches[0] : e;
		dragStart.current = { x: p.clientX, y: p.clientY, ox: offset.x, oy: offset.y };
	};
	const onPointerMove = (e) => {
		if (!dragging) return;
		const p = e.touches ? e.touches[0] : e;
		const dx = p.clientX - dragStart.current.x;
		const dy = p.clientY - dragStart.current.y;
		setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
	};
	const onPointerUp = () => setDragging(false);

	const downloadCanvas = (canvas, name) => {
		const url = canvas.toDataURL("image/jpeg", 0.95);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
	};

	const handleDownloadPhoto = () => {
		if (photoCanvasRef.current) downloadCanvas(photoCanvasRef.current, `passport-photo-${sizeId}.jpg`);
	};
	const handleDownloadSheet = () => {
		if (sheetCanvasRef.current) downloadCanvas(sheetCanvasRef.current, `photo-sheet-${paperId}.jpg`);
	};
	const handlePrint = () => {
		if (!sheetCanvasRef.current) return;
		setPrintSrc(sheetCanvasRef.current.toDataURL("image/jpeg", 0.98));
		setTimeout(() => window.print(), 150);
	};

	const resetFrame = () => {
		setZoom(1);
		setOffset({ x: 0, y: 0 });
	};

	const logout = () => {
		clearToken();
		navigate("/");
	}

	return (
		<div style={{ fontFamily: "'Inter', sans-serif", background: "#1b1815", minHeight: "100vh", color: "#e9e4d8" }}>
			{printSrc && (
				<div className="print-area" style={{ display: "none" }}>
					<img src={printSrc} alt="print sheet" style={{ display: "block" }} />
				</div>
			)}

			<div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
				<header style={{ marginBottom: 36, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #3a352c" }}>
					<div style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 14, }}>
						<img src="/logo.png" alt="" height={40} />
						<span className="op-mono" style={{ fontSize: 12, color: "#8a8478" }}>
							passport &amp; ID photo lab
						</span>
					</div>
					<button
						onClick={logout}
						className="logout"
					>Logout</button>
				</header>

				<div style={{ display: "flex", flexDirection: "row-reverse", gap: 36, justifyContent: 'center' }}>
					{/* PREVIEW — output images shown first, at the top */}
					<div className="op-preview-grid">
						<div>
							<p className="op-mono" style={{ fontSize: 11, color: "#8a8478", marginBottom: 10 }}>single frame — drag to reposition face</p>
							<div style={{
								display: "flex", alignItems: "center", justifyContent: "center", background: "#100e0b",
								borderRadius: 6, padding: 28, minHeight: 260
							}}>
								{!hasImage ? (
									<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "#4a453a", padding: "50px 0" }}>
										<ImageOff size={32} />
										<span style={{ fontSize: 13 }}>no image uploaded yet</span>
									</div>
								) : (
									<div
										ref={previewWrapRef}
										style={{ position: "relative", cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
										onMouseDown={onPointerDown}
										onMouseMove={onPointerMove}
										onMouseUp={onPointerUp}
										onMouseLeave={onPointerUp}
										onTouchStart={onPointerDown}
										onTouchMove={onPointerMove}
										onTouchEnd={onPointerUp}
									>
										<canvas ref={photoCanvasRef} style={{ width: 220, height: "auto", display: "block", border: "1px solid #4a453a" }} />
										<svg width="220" height={220 * (photoHmm / photoWmm)} viewBox="0 0 220 220" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} preserveAspectRatio="none">
											<ellipse cx="110" cy={110 * (photoHmm / photoWmm) * 0.92} rx="62" ry={80 * (photoHmm / photoWmm)} fill="none" stroke="#d4a24e" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
										</svg>
									</div>
								)}
							</div>
						</div>

						<div>
							<p className="op-mono" style={{ fontSize: 11, color: "#8a8478", marginBottom: 10 }}>contact sheet — {paper.label.toLowerCase()}</p>
							<div style={{ background: "#100e0b", borderRadius: 6, padding: 20, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 260 }}>
								{hasImage ? (
									<canvas ref={sheetCanvasRef} style={{ width: "100%", maxWidth: 320, height: "auto", background: "#fff", boxShadow: "0 0 0 1px #3a352c" }} />
								) : (
									<div style={{ color: "#4a453a", fontSize: 13, padding: "60px 0" }}>upload a photo to preview the sheet</div>
								)}
							</div>
						</div>
					</div>

					{/* CONTROLS */}
					<div className="op-controls-grid">
						<div>
							<label className="op-heading" style={{ fontSize: 12, color: "#d4a24e", display: "block", marginBottom: 10 }}>01 — raw image</label>
							<label style={{
								display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
								gap: 8, border: "1px dashed #4a453a", borderRadius: 4, padding: "22px 12px", cursor: "pointer"
							}}>
								<Upload size={20} color="#8a8478" />
								<span style={{ fontSize: 13, color: "#a89f8f" }}>{fileName || "Upload a photo"}</span>
								<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
							</label>
						</div>

						<div>
							<label className="op-heading" style={{ fontSize: 12, color: "#d4a24e", display: "block", marginBottom: 10 }}>02 — photo size</label>
							<select value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
								{SIZE_PRESETS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
							</select>
							{sizeId === "custom" && (
								<div style={{ display: "flex", gap: 8, marginTop: 8 }}>
									<input type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} placeholder="width mm" />
									<input type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} placeholder="height mm" />
								</div>
							)}
							<p className="op-mono" style={{ fontSize: 11, color: "#8a8478", marginTop: 6 }}>{photoWmm} × {photoHmm} mm at {DPI} dpi</p>
						</div>

						<div>
							<label className="op-heading" style={{ fontSize: 12, color: "#d4a24e", display: "block", marginBottom: 10 }}>03 — frame &amp; adjust</label>
							<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
								<div>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a89f8f", marginBottom: 4 }}>
										<span style={{ display: "flex", alignItems: "center", gap: 6 }}><ZoomIn size={13} /> zoom</span>
										<span className="op-mono">{zoom.toFixed(2)}×</span>
									</div>
									<input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%" }} />
								</div>
								<div>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a89f8f", marginBottom: 4 }}>
										<span style={{ display: "flex", alignItems: "center", gap: 6 }}><Sun size={13} /> brightness</span>
										<span className="op-mono">{brightness > 0 ? "+" : ""}{brightness}</span>
									</div>
									<input type="range" min="-50" max="50" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} style={{ width: "100%" }} />
								</div>
								<div>
									<div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a89f8f", marginBottom: 4 }}>
										<span style={{ display: "flex", alignItems: "center", gap: 6 }}><Aperture size={13} /> contrast</span>
										<span className="op-mono">{contrast > 0 ? "+" : ""}{contrast}</span>
									</div>
									<input type="range" min="-50" max="50" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} style={{ width: "100%" }} />
								</div>
								<button
									className="op-btn"
									onClick={() => setGrayscale((g) => !g)}
									style={grayscale ? { background: "#d4a24e", borderColor: "#d4a24e", color: "#1b1815" } : {}}
								>
									<Contrast size={14} /> {grayscale ? "black & white — on" : "black & white — off"}
								</button>
								<button className="op-btn" onClick={resetFrame}><RotateCcw size={14} /> reset frame</button>
							</div>
						</div>

						<div>
							<label className="op-heading" style={{ fontSize: 12, color: "#d4a24e", display: "block", marginBottom: 10 }}>04 — print sheet</label>
							<select value={paperId} onChange={(e) => setPaperId(e.target.value)} style={{ marginBottom: 8 }}>
								{PAPER_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
							</select>
							<div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a89f8f" }}>
								<span style={{ display: "flex", alignItems: "center", gap: 6 }}><Copy size={13} /> copies</span>
								<input
									type="number" min="1" max={maxCopies} value={copies}
									onChange={(e) => setCopies(Math.max(1, Math.min(maxCopies, Number(e.target.value))))}
									style={{ width: 70, marginLeft: "auto" }}
								/>
							</div>
							<p className="op-mono" style={{ fontSize: 11, color: "#8a8478", marginTop: 6 }}>fits up to {maxCopies} on this sheet</p>
						</div>

						<div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, gridColumn: "1 / -1" }}>
							<button className="op-btn" onClick={handleDownloadPhoto} disabled={!hasImage} style={{ flex: "1 1 200px" }}><Download size={15} /> download single photo</button>
							<button className="op-btn-primary op-btn" onClick={handleDownloadSheet} disabled={!hasImage} style={{ flex: "1 1 200px" }}><Download size={15} /> download print sheet</button>
							<button className="op-btn" onClick={handlePrint} disabled={!hasImage} style={{ flex: "1 1 200px" }}><Printer size={15} /> print sheet</button>
						</div>
					</div>
				</div>
				<footer>
					<p>Design and Develop by ❤ BISHAI </p>
				</footer>
			</div>
		</div>
	);
}
