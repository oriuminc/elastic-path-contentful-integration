import React from 'react';
// import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {Box} from "@contentful/f36-components";
import {useSortable} from "@dnd-kit/sortable";

// @ts-ignore
function Draggable({ id, ...props}) {
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id
  });

  return (
    <Box ref={setNodeRef}
         id={id}
         fullWidth={true}
         marginTop={'spacingS'}
         marginBottom={'spacingS'}
         style={{
           transition,
           transform: CSS.Translate.toString(transform),
           opacity: isDragging ? 0.5 : 1,
         }}
         {...props}
    >
      {
        props.children({ attributes, listeners, isDragging })
      }
    </Box>
  );
}
export default Draggable;