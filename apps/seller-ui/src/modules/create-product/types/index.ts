export interface IFile {
  file: File;
  id: string;
}
export interface AttributeValue {
  value: string;
  id: string;
  metadata: Record<string, any>;
}
export interface Attribute {
  name: string;
  values: AttributeValue[];
  id: string;
}
