export default function GetCoords(
  textarea: HTMLTextAreaElement,
  position: number,
  lineHeightPx: number
) {
  const style = window.getComputedStyle(textarea);
  const div = document.createElement('div');
  const span = document.createElement('span');

  const props = [
    'direction',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'letterSpacing',
    'textTransform',
    'wordSpacing',
    'textIndent',
    'whiteSpace',
    'wordBreak',
    'overflowWrap',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
    'lineHeight',
    'width',
  ] as const;

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.overflow = 'hidden';
  div.style.height = 'auto';

  for (const prop of props) {
    div.style[prop as any] = style[prop as any];
  }

  div.style.lineHeight = `${lineHeightPx}px`;

  const value = textarea.value.slice(0, position);
  div.textContent = value;

  span.textContent = textarea.value.slice(position) || '.';
  div.appendChild(span);

  document.body.appendChild(div);

  const coordinates = {
    top: span.offsetTop,
    left: span.offsetLeft,
    height: lineHeightPx,
  };

  document.body.removeChild(div);
  return coordinates;
}