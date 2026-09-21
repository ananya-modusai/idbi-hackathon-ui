import { FC, ReactNode } from 'react';

export interface StandardListItemProps {
  id: string;
  title: string;
  content: ReactNode;
  metadata: {
    renderArtifact: () => ReactNode;
    [key: string]: any;
  };
}

export interface StandardListProps {
  items: StandardListItemProps[];
  className?: string;
  onItemClick?: (item: StandardListItemProps) => void;
}

export const StandardListItem: FC<StandardListItemProps & { 
  onClick?: () => void;
}> = ({
  content,
  onClick
}) => {
  return (
    <li 
      className="cursor-pointer bg-gray-50/50 hover:bg-gray-100 rounded-md transition-colors duration-200 border border-gray-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex-grow">
          {content}
        </div>
      </div>
    </li>
  );
};

const StandardList: FC<StandardListProps> = ({ 
  items, 
  className = '', 
  onItemClick 
}) => {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <StandardListItem 
          key={item.id} 
          {...item} 
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </ul>
  );
};

export default StandardList;
