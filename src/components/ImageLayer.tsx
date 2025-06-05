"use client";
import dynamic from "next/dynamic";
import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface ImageLayerProps {
    imageUrl: string;
    x: number;
    y: number;
    size: number;
    rotation: number;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: { x: number; y: number; size: number; rotation: number }) => void;
    opacity?: number;
}

const ImageLayer = forwardRef<Konva.Image, ImageLayerProps>(({
    imageUrl,
    x,
    y,
    size,
    rotation,
    isSelected,
    onSelect,
    onChange,
    opacity = 1
}, ref) => {
    const [image] = useImage(imageUrl);
    const imageRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    useImperativeHandle(ref, () => imageRef.current as Konva.Image);

    useEffect(() => {
        if (isSelected && transformerRef.current) {
            transformerRef.current.nodes([imageRef.current!]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Image
                ref={imageRef}
                image={image}
                x={x}
                y={y}
                width={image ? image.width * (size / 100) : 0}
                height={image ? image.height * (size / 100) : 0}
                offsetX={image ? (image.width * (size / 100)) / 2 : 0}
                offsetY={image ? (image.height * (size / 100)) / 2 : 0}
                rotation={rotation}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={e => {
                    onChange({
                        x: e.target.x(),
                        y: e.target.y(),
                        size,
                        rotation
                    });
                }}
                onTransformEnd={() => {
                    const node = imageRef.current!;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    const ratio = Math.min(scaleX, scaleY);
                    // Reset scale to 1 after transforming
                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        x: node.x(),
                        y: node.y(),
                        size: size * ratio,
                        rotation: node.rotation()
                    });
                }}
                opacity={opacity}
            />
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit resizing
                        if (newBox.width < 20 || newBox.height < 20) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
});

export default ImageLayer;