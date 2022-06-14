# nestjs-file-upload

Upload files and perform validation in nestjs using decorators.

# Table of content

- [Installation](#installation)
- [Usage](#usage)
- [Arguments](#arguments)
- [Example](#example)
- [License](#license)

## Installation

Install using
```bash
npm i nestjs-file-upload
```

## Usage

1. Add the `FileField` decorator to the file fields in your dto.

```typescript
import { Expose } from "class-transformer";
import { FileField, File } from "nestjs-file-upload";

export class MyDto {
    @Expose()
    @FileField()
    myFile: File;

    @Expose()
    anotherField: string;
}
```

The `FileField` can be combined with other validators, such as validaiton validator from `class-validator`.

```typescript
import { Expose } from "class-transformer";
import { FileField, File } from "nestjs-file-upload";

export class MyDto {
    @Expose()
    @FileField()
    @IsNotEmpty()
    myFile: File;
}
```

2. Add the `FileInjector` decorator to the endpoint.

```typescript
import { Body, Controller, Post, ValidationPipe } from "@nestjs/common";

@Controller("my-controller")
export class MyController {
    @Post()
    @FileInjector(MyDto)
    public uploadFile(@Dto(ValidationPipe) dto: MyDto): void {
        console.log("Received file", dto.myFile.filename);
    }
}
```

## Arguments

An argument of type `fileFieldOptions` can be passed to the `FileField` decorator.

| Argument           | Type     | Description                                                                                                                                                        |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fieldname`        | string   | Overrides the property key. Can be used if the field in the form has a different name.                                                                             |
| `allowedMimeTypes` | string[] | Array of allowed mime types. Mime type validation is based on the reported type in the form. We may use magic numbers in the future.                               |
| `maxSize`          | number   | Maximum file size in bytes.                                                                                                                                        |
| `maxFile`          | number   | Maximum number of files. If the number is 1, the property will have a value of `File`. If the value if greater than 1, the property will have a value of `File[]`. |

## Example

An example is available in the [example](https://github.com/jtplouffe/nestjs-file-upload/tree/master/example).

## License

See the [LICENSE](https://github.com/jtplouffe/nestjs-file-upload/tree/master/LICENSE) for more info.
