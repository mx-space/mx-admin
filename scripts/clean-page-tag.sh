#!/bin/bash

# 获取所有 pag_va.b.c 格式的标签，按版本号排序
tags=$(git tag -l "page_v*" | sort -Vr)

# 初始化变量来保留最新的标签
latest_tag=""

# 遍历标签，删除除了最新之外的所有标签
for tag in $tags; do
  if [[ "$latest_tag" == "" ]]; then
    # 保留第一个标签（最新的标签）
    latest_tag=$tag
    echo "Keeping latest tag: $latest_tag"
  else
    # 删除本地标签
    git tag -d $tag
    echo "Deleted local tag: $tag"

    # 删除远程标签，假设远程名称为 origin
    git push origin --delete $tag
    echo "Deleted remote tag: $tag"
  fi
done

# 运行 git gc 来优化本地仓库
git gc --prune=now --aggressive
echo "Completed git garbage collection"
