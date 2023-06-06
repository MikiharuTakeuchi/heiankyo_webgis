import '@yaireo/ui-range';

export function setupSlider(element) {
    const width = 1024;
    element.innerHTML = `
  <div class="range-slider flat" data-ticks-position='top' style='${width}px; --min:-500; --max:500; --prefix:"$" --value-a:-220; --value-b:400; --text-value-a:"-220"; --text-value-b:"400";'>
    <input type="range" min="-500" max="500" value="-220" oninput="this.parentNode.style.setProperty('--value-a',this.value); this.parentNode.style.setProperty('--text-value-a', JSON.stringify(this.value))">
    <output></output>
    <input type="range" min="-500" max="500" value="400" oninput="this.parentNode.style.setProperty('--value-b',this.value); this.parentNode.style.setProperty('--text-value-b', JSON.stringify(this.value))">
    <output></output>
    <div class='range-slider__progress'></div>
  </div>
  `;
}
