import os
import cv2
import shutil
import asyncio
from fastapi import APIRouter, status, HTTPException
from app.config.settings import DEFAULT_FACE_DETECTION_MODEL, IMAGES_PATH
from app.yolov8 import YOLOv8
from app.yolov8.utils import class_names
from app.utils.classification import get_classes
from app.utils.wrappers import exception_handler_wrapper
from app.schemas.test import (
    TestRouteRequest,
    TestRouteResponse,
    DetectionData,
    ErrorResponse,
    AddSingleImageRequest,
    AddSingleImageResponse,
    TestImageResponse,
    GetImagesResponse,
)
from app.database.images import get_all_images_from_folder_id
from app.database.folders import get_all_folder_ids

router = APIRouter()


# Run class prediction in background thread (non-blocking)
async def run_get_classes(img_path):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_classes, img_path)


@router.post(
    "/return",
    response_model=TestRouteResponse,
    responses={code: {"model": ErrorResponse} for code in [400, 500]},
)
async def test_route(payload: TestRouteRequest):
    try:
        model_path = DEFAULT_FACE_DETECTION_MODEL
        yolov8_detector = YOLOv8(model_path, conf_thres=0.2, iou_thres=0.3)

        img_path = payload.path
        img = cv2.imread(img_path)

        if img is None:
            # Image path is invalid or unreadable
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse(
                    success=False,
                    message=f"Failed to load image: {img_path}",
                    error="Failed to load image",
                ).model_dump(),
            )

        boxes, scores, class_ids = yolov8_detector(img)
        detected_classes = [class_names[x] for x in class_ids]

        # Run classification in the background
        asyncio.create_task(run_get_classes(img_path))

        return TestRouteResponse(
            success=True,
            message="Object detection completed successfully",
            data=DetectionData(class_ids=class_ids, detected_classes=detected_classes),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                success=False, error="Internal server error", message=str(e)
            ).model_dump(),
        )


@router.get(
    "/images",
    response_model=GetImagesResponse,
    responses={code: {"model": ErrorResponse} for code in [500]},
)
@exception_handler_wrapper
def get_images():
    try:
        files = os.listdir(IMAGES_PATH)
        image_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".gif"]

        # Filter out only valid image files
        image_files = [
            os.path.abspath(os.path.join(IMAGES_PATH, file))
            for file in files
            if os.path.splitext(file)[1].lower() in image_extensions
        ]

        return GetImagesResponse(
            success=True,
            message="Successfully retrieved all images",
            data={"images": image_files},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                success=False, error="Internal server error", message=str(e)
            ).model_dump(),
        )


@router.post(
    "/single-image",
    response_model=AddSingleImageResponse,
    responses={code: {"model": ErrorResponse} for code in [400, 500]},
)
@exception_handler_wrapper
def add_single_image(payload: AddSingleImageRequest):
    try:
        image_path = payload.path

        # Check if path exists and is a file
        if not os.path.isfile(image_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse(
                    success=False,
                    error="Invalid file path",
                    message="The provided path is not a valid file",
                ).model_dump(),
            )

        image_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".gif"]
        file_extension = os.path.splitext(image_path)[1].lower()

        if file_extension not in image_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ErrorResponse(
                    success=False,
                    error="Invalid file type",
                    message="The file is not a supported image type",
                ),
            )

        # Copy image to gallery folder
        destination_path = os.path.join(IMAGES_PATH, os.path.basename(image_path))
        shutil.copy(image_path, destination_path)

        return AddSingleImageResponse(
            success=True,
            message="Image copied to the gallery successfully",
            data={"destination_path": destination_path},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                success=False, message="Internal server error", error=str(e)
            ).model_dump(),
        )


@router.get(
    "/test-image",
    response_model=TestImageResponse,
    responses={code: {"model": ErrorResponse} for code in [400]},
)
def test_images():
    try:
        folder_ids = get_all_folder_ids()
        for folder_id in folder_ids:
            print("Current Folder ID = ", folder_id)
            image_paths = get_all_images_from_folder_id(folder_id)
            print("Image Paths = ", image_paths)

        print("Folder IDS = ", folder_ids)
        return TestImageResponse(success=True, message="Success")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                success=False, message="Internal server error", error=str(e)
            ).model_dump(),
        )
