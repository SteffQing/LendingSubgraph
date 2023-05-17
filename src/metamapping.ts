import {
  json,
  Bytes,
  dataSource,
  JSONValue,
  log,
} from "@graphprotocol/graph-ts";
import { TokenAttribute, TokenMetadata } from "../generated/schema";

export function handleMetadata(content: Bytes): void {
  let tokenMetadata = new TokenMetadata(dataSource.stringParam());
  const value = json.fromBytes(content).toObject();
  if (value) {
    const image = value.get("image");
    const name = value.get("name");
    const description = value.get("description");

    if (name && image && description) {
      tokenMetadata.name = name.toString();
      tokenMetadata.image = image.toString();
      tokenMetadata.description = description.toString();
    }

    const attributes = value.get("attributes");
    if (attributes) {
      let attributeArray = attributes.toArray();
      setAttributes(attributeArray, tokenMetadata.id);
    }

    tokenMetadata.save();
  }
}

function setAttributes(attributeArray: JSONValue[], id: string): void {
  for (let i = 0; i < attributeArray.length; i++) {
    let attribute = attributeArray[i];
    let attributeObject = attribute.toObject();
    let try_traitType = attributeObject.get("trait_type");
    if (try_traitType == null) {
      try_traitType = attributeObject.get("traitType");
      if (try_traitType == null) {
        try_traitType = attributeObject.get("trait-type");
      }
    }
    let try_value = attributeObject.get("value");
    if (try_value !== null && try_traitType !== null) {
      let tokenAttributeEntityId = id.concat("-attribute").concat(i.toString());
      let tokenAttributeEntity = new TokenAttribute(tokenAttributeEntityId);
      tokenAttributeEntity.traitType = try_traitType.toString();
      tokenAttributeEntity.value = try_value.toString();
      tokenAttributeEntity.metadata = id;
      tokenAttributeEntity.save();
    }
  }
}
