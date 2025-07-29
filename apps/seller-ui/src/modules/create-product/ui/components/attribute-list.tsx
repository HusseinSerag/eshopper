import {
  cn,
  DragHandle,
  Input,
  SortableItem,
  SortableList,
  SortableWrapper,
} from '@eshopper/ui';
import { Attribute, AttributeValue } from '../../types';
import { useState, useEffect } from 'react';
import { Pen, Pencil, Plus, X } from 'lucide-react';
import { ColorPickerComponent } from './color-picker';
import { useProductForm } from '../context/form-contex';

interface Props {
  attributes: Attribute[];
  setAttributes(attributes: Attribute[]): void;
}

export function AttributeList({ attributes, setAttributes }: Props) {
  function changeAttributes(attribute: Attribute) {
    setAttributes(
      attributes.map((attr) => (attr.id === attribute.id ? attribute : attr))
    );
  }
  return (
    <SortableWrapper
      renderItem={(item, index) => {
        function valuesChange(values: AttributeValue[]) {
          setAttributes(
            attributes.map((attr) =>
              attr.id === item.id
                ? {
                    ...attr,
                    values,
                  }
                : attr
            )
          );
        }
        function removeAttr() {
          setAttributes(attributes.filter((attr) => attr.id !== item.id));
        }
        return (
          <SortableItem id={item.id}>
            <AttributeNameInput
              index={index}
              removeAttr={removeAttr}
              item={item}
              valuesChange={valuesChange}
              attributeChange={changeAttributes}
            />
          </SortableItem>
        );
      }}
      items={attributes}
      onChange={setAttributes}
    >
      <SortableList
        className="sm:justify-start items-start"
        renderItem={(item, index) => {
          function valuesChange(values: AttributeValue[]) {
            setAttributes(
              attributes.map((attr) =>
                attr.id === item.id
                  ? {
                      ...attr,
                      values: values,
                    }
                  : attr
              )
            );
          }
          function removeAttr() {
            setAttributes(attributes.filter((attr) => attr.id !== item.id));
          }
          return (
            <SortableItem id={item.id}>
              <AttributeNameInput
                index={index}
                item={item}
                removeAttr={removeAttr}
                valuesChange={valuesChange}
                attributeChange={changeAttributes}
              />
            </SortableItem>
          );
        }}
        items={attributes}
        onChange={setAttributes}
      />
    </SortableWrapper>
  );
}

// Define special attributes that need custom handling
const SpecialAttributes = ['color'];

function AttributeNameInput({
  item,
  valuesChange,
  removeAttr,
  attributeChange,
  index,
}: {
  item: Attribute;
  valuesChange(values: AttributeValue[]): void;
  removeAttr(): void;
  attributeChange(attr: Attribute): void;
  index: number;
}) {
  const [editName, setEditName] = useState(item.name);
  const [isEditing, setIsEditing] = useState(false);

  function isSpecialAttribute(attributeName: string): boolean {
    return SpecialAttributes.includes(attributeName.toLowerCase());
  }

  function onEditName(name: string) {
    const normalizedName = name.toLowerCase();
    const normalizedEditName = editName.toLowerCase();

    // Check if we're switching between special and regular attributes
    const switchingToSpecial =
      isSpecialAttribute(normalizedName) &&
      !isSpecialAttribute(normalizedEditName);
    const switchingFromSpecial =
      !isSpecialAttribute(normalizedName) &&
      isSpecialAttribute(normalizedEditName);
    const switchingBetweenSpecials =
      isSpecialAttribute(normalizedName) &&
      isSpecialAttribute(normalizedEditName) &&
      normalizedName !== normalizedEditName;

    // Clear values when switching to/from/between special attributes
    if (
      switchingToSpecial ||
      switchingFromSpecial ||
      switchingBetweenSpecials
    ) {
      valuesChange([]);
    }

    setEditName(name);
    attributeChange({
      ...item,
      name,
      values:
        switchingToSpecial || switchingFromSpecial || switchingBetweenSpecials
          ? []
          : item.values,
    });
  }

  const { form } = useProductForm();
  const attrError = form.getFieldState(`attributes.${index}.name`);
  const valuesError = form.getFieldState(`attributes.${index}.values`);

  return (
    <div className="max-w-[300px] relative flex flex-col p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-1">
            {!isEditing && (
              <h3 className="font-medium text-gray-900">{editName}</h3>
            )}
            {isEditing && (
              <Input
                value={editName}
                onChange={(e) => onEditName(e.target.value)}
                className="flex-1"
                placeholder="Attribute Name"
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              />
            )}
          </div>
          <button
            onClick={() => {
              if (editName === '' && isEditing === true) return;
              setIsEditing((o) => !o);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        {attrError.error && (
          <p className="text-sm font-semibold text-red-700">
            {attrError.error.message}
          </p>
        )}
        {valuesError.error && (
          <p className="text-sm font-semibold text-red-700">
            {valuesError.error.message}
          </p>
        )}
      </div>

      {/* Render special components based on attribute name */}
      {isSpecialAttribute(item.name.toLowerCase()) &&
        renderSpecialComponent(item, valuesChange, index)}

      {/* Render regular attribute component for non-special attributes */}
      {!isSpecialAttribute(item.name.toLowerCase()) && (
        <AttributeValueComponent
          attributeIndex={index}
          onChange={valuesChange}
          values={item.values}
        />
      )}

      <div className="absolute -top-2 -left-2">
        <DragHandle />
      </div>
      <button
        onClick={removeAttr}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors group"
      >
        <X className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
      </button>
    </div>
  );
}

// Helper function to render special components
function renderSpecialComponent(
  item: Attribute,
  valuesChange: (values: AttributeValue[]) => void,
  attributeIndex: number
) {
  const attributeName = item.name.toLowerCase();

  switch (attributeName) {
    case 'color':
      return (
        <ColorPickerComponent
          value={item.values.map((v, index) => ({
            color: v.value,
            name: v.metadata['name'] || '',
            order: index + 1,
          }))}
          onChange={(items) => {
            valuesChange(
              items.map((item) => ({
                id: crypto.randomUUID(),
                value: item.color,
                metadata: {
                  name: item.name,
                },
              }))
            );
          }}
        />
      );

    // Add other special attribute cases here
    // case 'size':
    //   return <SizePickerComponent ... />;
    // case 'material':
    //   return <MaterialPickerComponent ... />;

    default:
      return (
        <AttributeValueComponent
          attributeIndex={attributeIndex}
          onChange={valuesChange}
          values={item.values}
        />
      );
  }
}
interface IProps {
  onChange(values: AttributeValue[]): void;
  values: AttributeValue[];
  attributeIndex: number;
}

function AttributeValueComponent({ values, onChange, attributeIndex }: IProps) {
  const [input, setInput] = useState('');

  // Sync with props changes
  useEffect(() => {
    // This ensures component re-renders when values prop changes
  }, [values]);

  const disabledAdding = values.some((value) => value.value === input);
  function addValue() {
    if (disabledAdding) return;
    if (input.trim()) {
      const newValue: AttributeValue = {
        value: input,
        id: crypto.randomUUID(),
        metadata: {},
      };
      onChange([...values, newValue]);
      setInput(''); // Clear input after adding
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add new value..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addValue()}
          />
          <button
            disabled={disabledAdding}
            onClick={addValue}
            className="px-3 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:hover:border-slate-200 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-md transition-colors"
          >
            <Plus
              className={cn(
                'w-4 h-4 text-blue-600',
                disabledAdding && 'text-slate-600'
              )}
            />
          </button>
        </div>
        {disabledAdding && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
            You already have an attribute value with this value
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <SortableWrapper
          renderItem={(item, index) => {
            function onChangeValue(attr: AttributeValue) {
              onChange(values.map((val) => (val.id === item.id ? attr : val)));
            }
            function removeVal() {
              onChange(values.filter((val) => val.id !== item.id));
            }
            return (
              <SortableItem id={item.id}>
                <AttributeItemValue
                  index={index}
                  currentAttributeIndex={attributeIndex}
                  onRemoveValue={removeVal}
                  onChangeValue={onChangeValue}
                  item={item}
                />
              </SortableItem>
            );
          }}
          onChange={onChange}
          items={values}
        >
          <SortableList
            renderItem={(item, index) => {
              function onChangeValue(attr: AttributeValue) {
                onChange(
                  values.map((val) => (val.id === item.id ? attr : val))
                );
              }
              function removeVal() {
                onChange(values.filter((val) => val.id !== item.id));
              }
              return (
                <SortableItem id={item.id}>
                  <AttributeItemValue
                    currentAttributeIndex={attributeIndex}
                    index={index}
                    onRemoveValue={removeVal}
                    onChangeValue={onChangeValue}
                    item={item}
                  />
                </SortableItem>
              );
            }}
            onChange={onChange}
            items={values}
          />
        </SortableWrapper>
      </div>
    </div>
  );
}

function AttributeItemValue({
  item,
  onChangeValue,
  onRemoveValue,
  index,
  currentAttributeIndex,
}: {
  item: AttributeValue;
  onChangeValue(attr: AttributeValue): void;
  onRemoveValue(): void;
  index: number;
  currentAttributeIndex: number;
}) {
  const [editName, setEditName] = useState(item.value);
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when item.value changes (important for sortable updates)
  useEffect(() => {
    setEditName(item.value);
  }, [item.value]);

  function handleValueChange(newValue: string) {
    setEditName(newValue);
    onChangeValue({
      ...item,
      value: newValue,
    });
  }

  const { form } = useProductForm();
  const valueError = form.getFieldState(
    `attributes.${currentAttributeIndex}.values.${index}.value`
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="group relative inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
        {!isEditing && (
          <span className="text-sm text-gray-700 select-none">{editName}</span>
        )}
        {isEditing && (
          <Input
            value={editName}
            onChange={(e) => handleValueChange(e.target.value)}
            onBlur={() => {
              if (editName === '') return;
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editName === '') return;
                setIsEditing(false);
              }
            }}
            className="text-sm min-w-20"
          />
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              if (editName === '' && isEditing === true) return;
              setIsEditing(!isEditing);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <DragHandle />
          <button
            onClick={onRemoveValue}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      {valueError.error && (
        <div className="font-semibold text-xs text-red-700">
          {valueError.error.message}
        </div>
      )}
    </div>
  );
}
