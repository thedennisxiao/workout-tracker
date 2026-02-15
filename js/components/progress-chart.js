function createProgressChart(dataPoints, yLabel) {
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-chart';

  if (!dataPoints || dataPoints.length === 0) {
    wrapper.innerHTML = '<div class="empty-state">No data to chart</div>';
    return wrapper;
  }

  const canvas = document.createElement('canvas');
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  wrapper.appendChild(canvas);
  wrapper.appendChild(tooltip);

  const dpr = window.devicePixelRatio || 1;
  const height = 200;

  function draw() {
    const width = wrapper.clientWidth || 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 16, bottom: 32, left: 44 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;

    const values = dataPoints.map(d => d.value);
    let minV = Math.min(...values);
    let maxV = Math.max(...values);
    if (minV === maxV) {
      minV = minV - 1;
      maxV = maxV + 1;
    }
    const range = maxV - minV;

    function xPos(i) {
      if (dataPoints.length === 1) return pad.left + cw / 2;
      return pad.left + (i / (dataPoints.length - 1)) * cw;
    }
    function yPos(v) {
      return pad.top + ch - ((v - minV) / range) * ch;
    }

    // Grid lines
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 1;
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = pad.top + (i / gridCount) * ch;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxV - (i / gridCount) * range;
      ctx.fillStyle = '#888888';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val), pad.left - 8, y);
    }

    // Y-axis label
    if (yLabel) {
      ctx.save();
      ctx.fillStyle = '#888888';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.translate(12, pad.top + ch / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // X-axis month labels
    ctx.fillStyle = '#888888';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const shownMonths = new Set();
    dataPoints.forEach((dp, i) => {
      const d = new Date(dp.date);
      const key = d.getFullYear() + '-' + d.getMonth();
      if (!shownMonths.has(key)) {
        shownMonths.add(key);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        ctx.fillText(label, xPos(i), height - pad.bottom + 10);
      }
    });

    // Fill area
    if (dataPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(xPos(0), yPos(values[0]));
      for (let i = 1; i < dataPoints.length; i++) {
        ctx.lineTo(xPos(i), yPos(values[i]));
      }
      ctx.lineTo(xPos(dataPoints.length - 1), pad.top + ch);
      ctx.lineTo(xPos(0), pad.top + ch);
      ctx.closePath();
      ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    if (dataPoints.length === 1) {
      // Single dot
    } else {
      ctx.moveTo(xPos(0), yPos(values[0]));
      for (let i = 1; i < dataPoints.length; i++) {
        ctx.lineTo(xPos(i), yPos(values[i]));
      }
      ctx.stroke();
    }

    // Dots
    dataPoints.forEach((dp, i) => {
      ctx.beginPath();
      ctx.arc(xPos(i), yPos(dp.value), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#8B5CF6';
      ctx.fill();
      ctx.strokeStyle = '#0A0A0A';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Store positions for tap detection
    canvas._dots = dataPoints.map((dp, i) => ({
      x: xPos(i), y: yPos(dp.value), dp
    }));
  }

  // Tap/click handler for tooltip
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dots = canvas._dots || [];
    let closest = null;
    let minDist = 30;
    dots.forEach(dot => {
      const dist = Math.sqrt((dot.x - cx) ** 2 + (dot.y - cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = dot;
      }
    });
    if (closest) {
      const d = new Date(closest.dp.date);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      tooltip.textContent = `${label}: ${closest.dp.value} ${yLabel || 'lbs'}`;
      tooltip.style.left = Math.min(closest.x, wrapper.clientWidth - 100) + 'px';
      tooltip.style.top = (closest.y - 30) + 'px';
      tooltip.style.opacity = '1';
      clearTimeout(canvas._tipTimer);
      canvas._tipTimer = setTimeout(() => { tooltip.style.opacity = '0'; }, 2000);
    } else {
      tooltip.style.opacity = '0';
    }
  });

  // Draw after DOM insertion via requestAnimationFrame
  requestAnimationFrame(() => {
    draw();
  });

  // Redraw on resize
  const ro = new ResizeObserver(() => draw());
  ro.observe(wrapper);

  return wrapper;
}
