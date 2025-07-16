import _ from 'lodash';
import { useState, useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { useSizeCallback, useMount } from '../../../hooks';
import { MediaStream } from '../../../index-types';

export function useCanvasDimension(
  mediaStream: MediaStream | null,
  videoRef: MutableRefObject<HTMLCanvasElement | null>
) {
  const [dimension, setDimension] = useState({ width: 0, height: 0 });
  const debounceRef = useRef(_.debounce(setDimension, 0));
  const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const onCanvasResize = useCallback(
    ({ width, height }: any) => {
      if (videoRef?.current) {
        debounceRef.current({ width, height });
      }
    },
    [videoRef]
  );

  useSizeCallback(videoRef.current, onCanvasResize);

  useMount(() => {
    if (videoRef.current) {
      const { width, height } = videoRef.current.getBoundingClientRect();
      setDimension({ width, height });
    }
  });

  useEffect(() => {
    const { width, height } = dimension;
    if (!videoRef.current) return;

    try {
      // ⚠️ Set actual canvas pixels to match screen density
      videoRef.current.width = width * ratio;
      videoRef.current.height = height * ratio;

      // 🧼 Also scale style size so it doesn't explode visually
      videoRef.current.style.width = `${width}px`;
      videoRef.current.style.height = `${height}px`;
    } catch (e) {
      mediaStream?.updateVideoCanvasDimension(videoRef.current, width, height);
    }
  }, [mediaStream, dimension, videoRef, ratio]);

  return dimension;
}
