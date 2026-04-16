import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Focus from '@tiptap/extension-focus';

import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    ImageIcon, 
    Heading1,
    Heading2,
    Undo,
    Redo,
    Strikethrough,
    Link as LinkIcon,
    Quote,
    Eraser,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    CheckSquare,
    Table as TableIcon,
    Type as TypeIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface RichEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const RichEditor: React.FC<RichEditorProps> = ({ 
    value, 
    onChange, 
    placeholder = 'Nhập nội dung...', 
    className 
}) => {
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Typography,
            Focus.configure({
                className: 'has-focus',
                mode: 'all',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer font-medium transition-all hover:text-primary/80',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl shadow-lg my-6 max-w-full mx-auto transition-transform hover:scale-[1.01]',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CharacterCount,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[350px] p-8 focus:outline-none prose prose-pink max-w-none dark:prose-invert prose-img:rounded-3xl prose-img:shadow-2xl prose-img:mx-auto prose-headings:font-black prose-p:leading-relaxed prose-table:border-collapse prose-table:border prose-table:border-border",
                ),
            },
        },
    });

    // Sync content when value changes externally (but not when updated from within)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const setLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        setLinkUrl('');
    };

    const addImage = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl('');
        }
    };

    return (
        <TooltipProvider>
            <div className={cn(
                "border rounded-3xl bg-background transition-all duration-500 overflow-hidden shadow-sm group relative",
                editor.isFocused ? "ring-4 ring-primary/10 border-primary/50 shadow-xl" : "border-input hover:border-border",
                className
            )}>
                {/* Main Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-3 bg-muted/10 border-b border-border sticky top-0 z-20 backdrop-blur-md">
                {/* History */}
                <div className="flex items-center gap-1">
                    <EditorButton icon={Undo} onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác" />
                    <EditorButton icon={Redo} onClick={() => editor.chain().focus().redo().run()} title="Làm lại" />
                </div>

                <Separator />

                {/* Headings */}
                <div className="flex items-center gap-1">
                    <EditorButton 
                        icon={Heading1} 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                        active={editor.isActive('heading', { level: 1 })}
                        title="Tiêu đề 1"
                    />
                    <EditorButton 
                        icon={Heading2} 
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                        active={editor.isActive('heading', { level: 2 })}
                        title="Tiêu đề 2"
                    />
                     <EditorButton 
                        icon={TypeIcon} 
                        onClick={() => editor.chain().focus().setParagraph().run()} 
                        active={editor.isActive('paragraph')}
                        title="Văn bản thuần"
                    />
                </div>

                <Separator />

                {/* Basic Formatting */}
                <div className="flex items-center gap-1">
                    <EditorButton 
                        icon={Bold} 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        active={editor.isActive('bold')}
                        title="In đậm (Ctrl+B)"
                    />
                    <EditorButton 
                        icon={Italic} 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        active={editor.isActive('italic')}
                        title="In nghiêng (Ctrl+I)"
                    />
                    <EditorButton 
                        icon={UnderlineIcon} 
                        onClick={() => editor.chain().focus().toggleUnderline().run()} 
                        active={editor.isActive('underline')}
                        title="Gạch chân (Ctrl+U)"
                    />
                    <EditorButton 
                        icon={Strikethrough} 
                        onClick={() => editor.chain().focus().toggleStrike().run()} 
                        active={editor.isActive('strike')}
                        title="Gạch ngang"
                    />
                </div>

                <Separator />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                    <EditorButton 
                        icon={AlignLeft} 
                        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                        active={editor.isActive({ textAlign: 'left' })}
                        title="Căn lề trái"
                    />
                    <EditorButton 
                        icon={AlignCenter} 
                        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                        active={editor.isActive({ textAlign: 'center' })}
                        title="Căn giữa"
                    />
                    <EditorButton 
                        icon={AlignRight} 
                        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                        active={editor.isActive({ textAlign: 'right' })}
                        title="Căn lề phải"
                    />
                </div>

                <Separator />

                {/* Lists & Blocks */}
                <div className="flex items-center gap-1">
                    <EditorButton 
                        icon={List} 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        active={editor.isActive('bulletList')}
                        title="Danh sách dấu chấm"
                    />
                    <EditorButton 
                        icon={ListOrdered} 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                        active={editor.isActive('orderedList')}
                        title="Danh sách số"
                    />
                    <EditorButton 
                        icon={CheckSquare} 
                        onClick={() => editor.chain().focus().toggleTaskList().run()} 
                        active={editor.isActive('taskList')}
                        title="Danh sách công việc"
                    />
                    <EditorButton 
                        icon={Quote} 
                        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                        active={editor.isActive('blockquote')}
                        title="Trích dẫn"
                    />
                </div>

                <Separator />

                {/* Insert */}
                <div className="flex items-center gap-1">
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary">
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3 flex gap-2 shadow-2xl border-primary/20">
                            <Input 
                                placeholder="Dán link liên kết..." 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                                className="h-9 focus-visible:ring-primary/30"
                            />
                            <Button size="sm" onClick={setLink}>Gắn</Button>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary">
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-3 flex gap-2 shadow-2xl border-primary/20">
                            <Input 
                                placeholder="Dán URL hình ảnh..." 
                                value={imageUrl} 
                                onChange={(e) => setImageUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addImage()}
                                className="h-9 focus-visible:ring-primary/30"
                            />
                            <Button size="sm" onClick={addImage}>Chèn</Button>
                        </PopoverContent>
                    </Popover>

                    <EditorButton 
                        icon={TableIcon} 
                        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
                        title="Chèn bảng"
                    />
                    <EditorButton 
                        icon={Highlighter} 
                        onClick={() => editor.chain().focus().toggleHighlight().run()} 
                        active={editor.isActive('highlight')}
                        title="Tô màu chữ"
                    />
                </div>

                <div className="flex-1" />
                
                <EditorButton 
                    icon={Eraser} 
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
                    title="Xóa định dạng" 
                />
            </div>

            {/* Editable Area */}
            <div className="relative cursor-text min-h-[350px]">
                <EditorContent editor={editor} />
                {editor.isEmpty && (
                     <div className="absolute top-8 left-8 text-muted-foreground/30 pointer-events-none select-none italic text-base">
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="px-5 py-2.5 bg-muted/5 border-t border-border flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Rich Editor Pro Experience
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                        <span className="opacity-50 uppercase text-[9px]">Words:</span>
                        {editor.storage.characterCount?.words?.() || 0}
                    </div>
                    <div className="flex items-center gap-1.5">
                         <span className="opacity-50 uppercase text-[9px]">Chars:</span>
                        {editor.storage.characterCount?.characters?.() || 0}
                    </div>
                </div>
            </div>
        </div>
        </TooltipProvider>
    );
};

const Separator = () => <div className="w-px h-6 bg-border mx-1 opacity-60" />;

interface EditorButtonProps {
    icon: React.ElementType;
    onClick: () => void;
    title?: string;
    active?: boolean;
}

const EditorButton: React.FC<EditorButtonProps> = ({ icon: Icon, onClick, title, active }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                    "h-9 w-9 p-0 rounded-xl transition-all duration-300",
                    active 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 active:scale-95" 
                        : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                )}
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
            >
                <Icon className="h-4 w-4" />
            </Button>
        </TooltipTrigger>
        {title && (
            <TooltipContent side="top" className="text-[10px] font-bold py-1 px-2 border-primary/20 shadow-lg">
                <p>{title}</p>
            </TooltipContent>
        )}
    </Tooltip>
);

export default RichEditor;
