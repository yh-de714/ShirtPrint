"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Transformer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';

const ImageLayer = dynamic(()=> import('./ImageLayer'), {ssr:false}); 

interface DesignCanvasProps {
    images: Array<{
        id: string;
        url: string;
        size: number;
        rotation: number;
        x: number;
        y: number;
    }>;
    printableArea: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
    selectedImageId: string | null;
    onImageSelect: (id: string) => void;
    onImageUpdate: (id: string, updates: Partial<{ size: number; rotation: number; x: number; y: number }>) => void;
    texts: Array<{
        id: string;
        text: string;
        fontSize: number;
        color: string;
        font?: string;
        x?: number;
        y?: number;
        rotation?: number;
    }>;
    onTextSelect?: (id: string) => void;
    selectedTextId?: string | null;
    containerWidth: number;
    onTextUpdate?: (id: string, updates: Partial<{ text: string; fontSize: number; color: string; x: number; y: number; rotation: number }>) => void;
    onTextDoubleClick?: (id: string) => void;
    exporting: boolean;
    onDeselect?: () => void;
}

export interface DesignCanvasRef {
    setPosition: (x: number, y: number) => void;
    getImageDimensions: () => { width: number; height: number; scaleX: number; scaleY: number } | null;
    getPosition: () => { x: number; y: number } | null;
    getContainerWidth: () => number;
    getStageCanvas: () => HTMLCanvasElement | null;
    getStage: () => Konva.Stage | null;
}

interface TextWithTapTime extends Konva.Text {
    lastTapTime?: number;
}

const DesignCanvas = forwardRef<DesignCanvasRef, DesignCanvasProps>(({
    images,
    printableArea,
    selectedImageId,
    onImageSelect,
    onImageUpdate,
    texts,
    onTextSelect,
    selectedTextId,
    onTextUpdate,
    containerWidth,
    onTextDoubleClick,
    exporting,
    onDeselect
}, ref) => {
    const stageRef = useRef<Konva.Stage>(null);
    const imageRefs = useRef<{ [key: string]: Konva.Image | null }>({});
    const textRefs = useRef<{ [key: string]: TextWithTapTime | null }>({});
    const transformerRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (!transformerRef.current) return;

        if (selectedTextId) {
            const textNode = textRefs.current[selectedTextId];
            if (textNode) {
                transformerRef.current.nodes([textNode]);
                transformerRef.current.getLayer()?.batchDraw();
            }
        } else {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedTextId]);

    useImperativeHandle(ref, () => ({
        setPosition: (x: number, y: number) => {
            if (selectedImageId) {
                onImageUpdate(selectedImageId, { x, y });
            }
        },
        getImageDimensions: () => {
            if (selectedImageId) {
                const selectedImage = images.find(img => img.id === selectedImageId);
                if (selectedImage) {
                    const img = document.createElement('img');
                    img.src = selectedImage.url;

                    return {
                        width: img.width || 100,
                        height: img.height || 100,
                        scaleX: selectedImage.size / 100,
                        scaleY: selectedImage.size / 100
                    };
                }
            }
            return null;
        },
        getPosition: () => {
            if (selectedImageId) {
                const selectedImage = images.find(img => img.id === selectedImageId);
                if (selectedImage) {
                    return {
                        x: selectedImage.x,
                        y: selectedImage.y
                    };
                }
            }
            return null;
        },
        getContainerWidth: () => containerWidth,
        getStageCanvas: () => {
            if (stageRef.current) {
                const canvas = document.createElement('canvas');
                const pixelRatio = 2;
                canvas.width = printableArea.width * pixelRatio;
                canvas.height = printableArea.height * pixelRatio;
                const context = canvas.getContext('2d');

                if (context) {
                    const stageCanvas = stageRef.current.toCanvas({
                        pixelRatio: pixelRatio,
                        x: printableArea.left,
                        y: printableArea.top,
                        width: printableArea.width,
                        height: printableArea.height
                    });

                    context.drawImage(
                        stageCanvas,
                        0, 0,
                        canvas.width, canvas.height
                    );

                    return canvas;
                }
            }
            return null;
        },
        getStage: () => {
            return stageRef.current;
        }
    }));

    const handleTextDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
        if (onTextUpdate) {
            onTextUpdate(id, {
                x: e.target.x(),
                y: e.target.y()
            });
        }
    };

    const handleTextTransform = (id: string) => {
        const textNode = textRefs.current[id];
        if (textNode && onTextUpdate) {
            onTextUpdate(id, {
                x: textNode.x(),
                y: textNode.y(),
                fontSize: textNode.fontSize() * textNode.scaleX(),
                rotation: textNode.rotation()
            });

            textNode.scaleX(1);
            textNode.scaleY(1);
        }
    };

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage();

        if (clickedOnEmpty && onDeselect) {
            onDeselect();
        }
    };

    return (
        <>
            <Stage
                ref={stageRef}
                width={containerWidth}
                height={500}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    transform: 'translate(-50%, -50%)',
                }}
                onClick={handleStageClick}
                onTap={handleStageClick}
            >
                <Layer>
                    <Group
                        clipFunc={(ctx) => {
                            ctx.beginPath();
                            ctx.rect(
                                printableArea.left,
                                printableArea.top,
                                printableArea.width,
                                printableArea.height
                            );
                            ctx.closePath();
                        }}
                    >
                        {images.map(image => (
                            <ImageLayer
                                key={`clipped-${image.id}`}
                                imageUrl={image.url}
                                x={image.x}
                                y={image.y}
                                size={image.size}
                                rotation={image.rotation}
                                isSelected={false}
                                onSelect={() => onImageSelect(image.id)}
                                onChange={(newAttrs) => onImageUpdate(image.id, newAttrs)}
                                opacity={1}
                            />
                        ))}
                    </Group>

                    <Rect
                        x={printableArea.left}
                        y={printableArea.top}
                        width={printableArea.width}
                        height={printableArea.height}
                        strokeWidth={2}
                        dash={[4, 4]}
                        listening={false}
                    />

                    {!exporting && texts.map((el) => (
                        <Text
                            key={el.id}
                            ref={(node) => {
                                textRefs.current[el.id] = node as TextWithTapTime;
                            }}
                            text={el.text}
                            x={el.x || printableArea.left + printableArea.width / 2}
                            y={el.y || printableArea.top + printableArea.height / 2}
                            fontSize={el.fontSize}
                            fill={el.color}
                            fontFamily={el.font || 'Arial'}
                            rotation={el.rotation || 0}
                            draggable
                            offsetX={el.text.length * el.fontSize / 4}
                            offsetY={el.fontSize / 2}
                            onClick={() => onTextSelect && onTextSelect(el.id)}
                            onTap={() => onTextSelect && onTextSelect(el.id)}
                            onDblClick={() => onTextDoubleClick && onTextDoubleClick(el.id)}
                            onDblTap={() => onTextDoubleClick && onTextDoubleClick(el.id)}
                            onTouchEnd={(_) => {
                                const now = Date.now();
                                const lastTap = textRefs.current[el.id]?.lastTapTime || 0;
                                const tapLength = now - lastTap;

                                if (tapLength < 500 && tapLength > 0) {
                                    if (onTextDoubleClick) {
                                        onTextDoubleClick(el.id);
                                    }
                                }

                                if (textRefs.current[el.id]) {
                                    textRefs.current[el.id]!.lastTapTime = now;
                                }
                            }}
                            onDragEnd={(e) => handleTextDragEnd(e, el.id)}
                            onTransformEnd={() => handleTextTransform(el.id)}
                            opacity={0.3}
                        />
                    ))}
                    <Group
                        clipFunc={(ctx) => {
                            ctx.beginPath();
                            ctx.rect(
                                printableArea.left,
                                printableArea.top,
                                printableArea.width,
                                printableArea.height
                            );
                            ctx.closePath();
                        }}
                    >
                        {texts.map((el) => (
                            <Text
                                key={el.id}
                                ref={(node) => {
                                    textRefs.current[el.id] = node as TextWithTapTime;
                                }}
                                text={el.text}
                                x={el.x || printableArea.left + printableArea.width / 2}
                                y={el.y || printableArea.top + printableArea.height / 2}
                                fontSize={el.fontSize}
                                fill={el.color}
                                fontFamily={el.font || 'Arial'}
                                rotation={el.rotation || 0}
                                draggable
                                offsetX={el.text.length * el.fontSize / 4}
                                offsetY={el.fontSize / 2}
                                onClick={() => onTextSelect && onTextSelect(el.id)}
                                onTap={() => onTextSelect && onTextSelect(el.id)}
                                onDblClick={() => onTextDoubleClick && onTextDoubleClick(el.id)}
                                onDblTap={() => onTextDoubleClick && onTextDoubleClick(el.id)}
                                onTouchEnd={(_) => {
                                    const now = Date.now();
                                    const lastTap = textRefs.current[el.id]?.lastTapTime || 0;
                                    const tapLength = now - lastTap;

                                    if (tapLength < 500 && tapLength > 0) {
                                        if (onTextDoubleClick) {
                                            onTextDoubleClick(el.id);
                                        }
                                    }

                                    if (textRefs.current[el.id]) {
                                        textRefs.current[el.id]!.lastTapTime = now;
                                    }
                                }}
                                onDragEnd={(e) => handleTextDragEnd(e, el.id)}
                                onTransformEnd={() => handleTextTransform(el.id)}
                            />
                        ))}
                    </Group>
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 10 || newBox.height < 10) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                        enabledAnchors={['middle-left', 'middle-right']}
                        rotateEnabled={true}
                        keepRatio={false}
                    />
                </Layer>
            </Stage>
        </>
    );
});

export default DesignCanvas;